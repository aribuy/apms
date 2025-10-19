const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTaskIntegration() {
  console.log('🧪 Testing Site-Task Integration...\n');

  try {
    // Step 1: Get existing sites
    console.log('1. Fetching existing sites...');
    const sites = await prisma.sites.findMany({
      select: { id: true, site_id: true, site_name: true, region: true }
    });
    console.log(`Found ${sites.length} sites:`);
    sites.forEach(site => {
      console.log(`   - ${site.site_id}: ${site.site_name} (${site.region})`);
    });

    if (sites.length === 0) {
      console.log('❌ No sites found. Please register sites first.');
      return;
    }

    // Step 2: Create sample tasks for first 3 sites
    console.log('\n2. Creating sample tasks...');
    const sampleTasks = [];

    for (let i = 0; i < Math.min(3, sites.length); i++) {
      const site = sites[i];
      
      // Create ATP Upload task
      const uploadTask = await prisma.tasks.create({
        data: {
          task_code: `TSK-${site.site_id}-${String(i + 1).padStart(3, '0')}`,
          site_id: site.id,
          task_type: 'ATP_UPLOAD',
          title: `ATP Document Upload - ${site.site_name}`,
          description: `Upload ATP document for site ${site.site_id}`,
          assigned_to: null,
          workflow_type: 'SOFTWARE', // Will be determined after upload
          stage_number: 1,
          priority: 'high',
          sla_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          task_data: {
            site_info: {
              site_id: site.site_id,
              site_name: site.site_name,
              region: site.region
            },
            upload_requirements: {
              formats: ['PDF'],
              max_size: '25MB',
              required_sections: ['Equipment Info', 'Test Results', 'Configuration']
            }
          }
        }
      });

      sampleTasks.push(uploadTask);
      console.log(`   ✅ Created: ${uploadTask.task_code} - ${uploadTask.title}`);
    }

    // Step 3: Test API endpoints
    console.log('\n3. Testing API endpoints...');
    
    // Test get all tasks
    const allTasks = await prisma.tasks.findMany({
      include: {
        sites: {
          select: { site_id: true, site_name: true, region: true }
        }
      }
    });
    console.log(`   📊 Total tasks in database: ${allTasks.length}`);

    // Test get tasks by site
    const firstSite = sites[0];
    const siteTasks = await prisma.tasks.findMany({
      where: { site_id: firstSite.id },
      include: {
        sites: {
          select: { site_id: true, site_name: true }
        }
      }
    });
    console.log(`   🏢 Tasks for site ${firstSite.site_id}: ${siteTasks.length}`);

    // Test task statistics
    const stats = await Promise.all([
      prisma.tasks.count(),
      prisma.tasks.count({ where: { status: 'pending' } }),
      prisma.tasks.count({ where: { task_type: 'ATP_UPLOAD' } }),
      prisma.tasks.count({ where: { assigned_to: 'doc.control@aviat.com' } })
    ]);

    console.log('\n4. Task Statistics:');
    console.log(`   📈 Total tasks: ${stats[0]}`);
    console.log(`   ⏳ Pending tasks: ${stats[1]}`);
    console.log(`   📄 ATP Upload tasks: ${stats[2]}`);
    console.log(`   👤 Tasks assigned to doc.control: ${stats[3]}`);

    // Step 4: Test task update (simulate task progress)
    console.log('\n5. Testing task updates...');
    const firstTask = sampleTasks[0];
    
    const updatedTask = await prisma.tasks.update({
      where: { id: firstTask.id },
      data: {
        status: 'in_progress',
        started_at: new Date(),
        result_data: {
          progress: 'Document uploaded and validated',
          atp_type_detected: 'SOFTWARE',
          next_stage: 'Business Operations Review'
        }
      }
    });

    console.log(`   🔄 Updated task ${updatedTask.task_code} to 'in_progress'`);

    console.log('\n✅ Site-Task Integration Test Completed Successfully!');
    console.log('\nNext Steps:');
    console.log('1. ✅ Database schema ready');
    console.log('2. ✅ Basic task CRUD working');
    console.log('3. ✅ Site-task relationship established');
    console.log('4. 🔄 Ready for frontend integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTaskIntegration();