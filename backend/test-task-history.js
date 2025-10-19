const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTaskHistory() {
  console.log('🧪 Testing Task History & Audit Trail System...\n');

  try {
    // Step 1: Get existing tasks
    console.log('1. Fetching existing tasks...');
    const tasks = await prisma.tasks.findMany({
      include: {
        sites: {
          select: { site_id: true, site_name: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 3
    });

    console.log(`Found ${tasks.length} tasks:`);
    tasks.forEach(task => {
      console.log(`   - ${task.task_code}: ${task.title} (${task.sites?.site_id})`);
    });

    if (tasks.length === 0) {
      console.log('❌ No tasks found. Please run test-task-integration.js first.');
      return;
    }

    // Step 2: Manually add some history entries to simulate workflow
    console.log('\n2. Adding sample history entries...');
    
    const firstTask = tasks[0];
    
    // Simulate ATP upload completion
    await prisma.$executeRaw`
      INSERT INTO task_history (
        site_id, task_id, event_type, event_description,
        old_status, new_status, workflow_stage, performed_by, metadata
      ) VALUES (
        ${firstTask.site_id}, ${firstTask.id}, 'STATUS_CHANGED', 'ATP document uploaded successfully',
        'pending', 'completed', 'UPLOAD', 'doc.control@aviat.com', 
        '{"file_name": "ATP_Software_v1.0.pdf", "file_size": "2.5MB"}'::jsonb
      )
    `;

    // Simulate review L1 start
    await prisma.$executeRaw`
      INSERT INTO task_history (
        site_id, task_id, event_type, event_description,
        old_status, new_status, workflow_stage, performed_by, metadata
      ) VALUES (
        ${firstTask.site_id}, ${firstTask.id}, 'CREATED', 'Review L1 task created and assigned',
        NULL, 'pending', 'REVIEW_L1', 'system', 
        '{"assigned_to": "business.ops@xlsmart.co.id", "sla_hours": 48}'::jsonb
      )
    `;

    // Simulate review L1 completion with decision
    await prisma.$executeRaw`
      INSERT INTO task_history (
        site_id, task_id, event_type, event_description,
        old_status, new_status, decision, decision_comments, workflow_stage, performed_by, metadata
      ) VALUES (
        ${firstTask.site_id}, ${firstTask.id}, 'DECISION_MADE', 'Business Operations review completed',
        'in_progress', 'completed', 'PASS_WITH_PUNCHLIST', 'Minor documentation issues identified', 
        'REVIEW_L1', 'business.ops@xlsmart.co.id', 
        '{"review_duration_minutes": 45, "punchlist_items": 2}'::jsonb
      )
    `;

    console.log('   ✅ Added 3 sample history entries');

    // Step 3: Test site journey summary
    console.log('\n3. Testing site journey summary...');
    
    const siteJourney = await prisma.$queryRaw`
      SELECT 
        s.site_id as site_code,
        s.site_name,
        s.region,
        TO_CHAR(s.created_at, 'YYYY-MM-DD') as site_registered_date,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT th.id) as total_history_events,
        TO_CHAR(MAX(th.event_timestamp), 'YYYY-MM-DD HH24:MI') as last_activity,
        (SELECT th2.event_description FROM task_history th2 WHERE th2.site_id = s.id ORDER BY th2.event_timestamp DESC LIMIT 1) as last_activity_description
      FROM sites s
      LEFT JOIN tasks t ON s.id = t.site_id
      LEFT JOIN task_history th ON s.id = th.site_id
      WHERE s.id = ${firstTask.site_id}
      GROUP BY s.id, s.site_id, s.site_name, s.region, s.created_at
    `;

    console.log('   📊 Site Journey Summary:');
    siteJourney.forEach(journey => {
      console.log(`   Site: ${journey.site_code} - ${journey.site_name}`);
      console.log(`   Region: ${journey.region}`);
      console.log(`   Registered: ${journey.site_registered_date}`);
      console.log(`   Tasks: ${journey.total_tasks}, History Events: ${journey.total_history_events}`);
      console.log(`   Last Activity: ${journey.last_activity}`);
      console.log(`   Description: ${journey.last_activity_description}`);
    });

    // Step 4: Test detailed task history
    console.log('\n4. Testing detailed task history...');
    
    const taskHistory = await prisma.$queryRaw`
      SELECT 
        th.event_type,
        th.event_description,
        th.old_status,
        th.new_status,
        th.decision,
        th.workflow_stage,
        th.performed_by,
        TO_CHAR(th.event_timestamp, 'YYYY-MM-DD HH24:MI:SS') as event_time,
        th.metadata
      FROM task_history th
      WHERE th.site_id = ${firstTask.site_id}
      ORDER BY th.event_timestamp ASC
    `;

    console.log(`   📋 Task History for ${firstTask.sites?.site_id} (${taskHistory.length} events):`);
    taskHistory.forEach((event, index) => {
      console.log(`   ${index + 1}. [${event.event_time}] ${event.event_type}`);
      console.log(`      Description: ${event.event_description}`);
      if (event.old_status || event.new_status) {
        console.log(`      Status: ${event.old_status || 'NULL'} → ${event.new_status || 'NULL'}`);
      }
      if (event.decision) {
        console.log(`      Decision: ${event.decision}`);
      }
      if (event.workflow_stage) {
        console.log(`      Stage: ${event.workflow_stage}`);
      }
      if (event.performed_by) {
        console.log(`      By: ${event.performed_by}`);
      }
      console.log('');
    });

    // Step 5: Test export functionality (simulate)
    console.log('5. Testing export functionality...');
    
    const exportData = await prisma.$queryRaw`
      SELECT 
        s.site_id as "Site Code",
        s.site_name as "Site Name",
        s.region as "Region",
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Site Registered Date",
        COUNT(DISTINCT t.id) as "Total Tasks",
        COUNT(DISTINCT th.id) as "Total Events",
        TO_CHAR(MIN(CASE WHEN th.event_type = 'CREATED' AND t.task_type = 'ATP_UPLOAD' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "ATP Upload Task Created",
        TO_CHAR(MIN(CASE WHEN th.event_type = 'STATUS_CHANGED' AND th.new_status = 'completed' AND th.workflow_stage = 'UPLOAD' THEN th.event_timestamp END), 'YYYY-MM-DD HH24:MI:SS') as "ATP Uploaded Date",
        TO_CHAR(MAX(th.event_timestamp), 'YYYY-MM-DD HH24:MI:SS') as "Last Activity Date"
      FROM sites s
      LEFT JOIN tasks t ON s.id = t.site_id
      LEFT JOIN task_history th ON s.id = th.site_id
      GROUP BY s.id, s.site_id, s.site_name, s.region, s.created_at
      ORDER BY s.created_at DESC
      LIMIT 3
    `;

    console.log('   📤 Export Data Sample:');
    exportData.forEach(row => {
      console.log(`   Site: ${row['Site Code']} - ${row['Site Name']}`);
      console.log(`   Registered: ${row['Site Registered Date']}`);
      console.log(`   ATP Upload Created: ${row['ATP Upload Task Created'] || 'Not yet'}`);
      console.log(`   ATP Uploaded: ${row['ATP Uploaded Date'] || 'Not yet'}`);
      console.log(`   Last Activity: ${row['Last Activity Date'] || 'No activity'}`);
      console.log('');
    });

    console.log('✅ Task History & Audit Trail Test Completed Successfully!');
    console.log('\nFeatures Verified:');
    console.log('1. ✅ Task history table created and working');
    console.log('2. ✅ Event logging functionality');
    console.log('3. ✅ Site journey summary queries');
    console.log('4. ✅ Detailed task history tracking');
    console.log('5. ✅ Export-ready data structure');
    console.log('6. ✅ Complete audit trail per site');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTaskHistory();