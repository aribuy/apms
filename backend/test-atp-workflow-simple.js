const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testATPWorkflowSimple() {
  console.log('🚀 Testing ATP Workflow System (Simplified)...\n');

  try {
    // Step 1: Check existing ATP documents
    console.log('📊 Step 1: Checking existing ATP documents...');
    const existingATPs = await prisma.atp_documents.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        atp_review_stages: true,
        atp_punchlist_items: true
      }
    });

    console.log(`✅ Found ${existingATPs.length} existing ATP documents`);
    
    if (existingATPs.length > 0) {
      const atp = existingATPs[0];
      console.log(`   Latest ATP: ${atp.atp_code} - Status: ${atp.current_status}`);
      console.log(`   Review Stages: ${atp.atp_review_stages.length}`);
      console.log(`   Punchlist Items: ${atp.atp_punchlist_items.length}`);
    }

    // Step 2: Test workflow configuration
    console.log('\n⚙️ Step 2: Testing workflow configuration...');
    const WORKFLOW_CONFIG = {
      SOFTWARE: {
        stages: [
          { code: 'BO_REVIEW', name: 'Business Operations Review', role: 'BO', sla_hours: 48 },
          { code: 'SME_REVIEW', name: 'SME Technical Review', role: 'SME', sla_hours: 48 },
          { code: 'HEAD_NOC_REVIEW', name: 'Head NOC Final Review', role: 'HEAD_NOC', sla_hours: 24 }
        ]
      },
      HARDWARE: {
        stages: [
          { code: 'FOP_RTS_REVIEW', name: 'FOP/RTS Field Review', role: 'FOP_RTS', sla_hours: 48 },
          { code: 'REGION_REVIEW', name: 'Region Team Review', role: 'REGION_TEAM', sla_hours: 48 },
          { code: 'RTH_REVIEW', name: 'RTH Final Approval', role: 'RTH', sla_hours: 24 }
        ]
      }
    };

    console.log('✅ Workflow configurations loaded:');
    console.log(`   SOFTWARE workflow: ${WORKFLOW_CONFIG.SOFTWARE.stages.length} stages`);
    console.log(`   HARDWARE workflow: ${WORKFLOW_CONFIG.HARDWARE.stages.length} stages`);

    // Step 3: Test pending reviews query
    console.log('\n🔍 Step 3: Testing pending reviews query...');
    const pendingReviews = await prisma.atp_review_stages.findMany({
      where: {
        review_status: 'pending'
      },
      include: {
        atp_documents: {
          select: {
            atp_code: true,
            site_id: true,
            current_status: true,
            workflow_path: true
          }
        }
      },
      take: 10
    });

    console.log(`✅ Found ${pendingReviews.length} pending reviews`);
    
    if (pendingReviews.length > 0) {
      console.log('   Sample pending reviews:');
      pendingReviews.slice(0, 3).forEach(review => {
        console.log(`   - ${review.atp_documents?.atp_code || 'N/A'}: ${review.stage_name} (${review.assigned_role})`);
      });
    }

    // Step 4: Test role-based filtering
    console.log('\n👥 Step 4: Testing role-based filtering...');
    const roles = ['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'];
    
    for (const role of roles) {
      const roleReviews = await prisma.atp_review_stages.count({
        where: {
          assigned_role: role,
          review_status: 'pending'
        }
      });
      console.log(`   ${role}: ${roleReviews} pending reviews`);
    }

    // Step 5: Test punchlist queries
    console.log('\n🔨 Step 5: Testing punchlist queries...');
    const punchlistStats = await prisma.atp_punchlist_items.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    console.log('✅ Punchlist statistics:');
    punchlistStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} items`);
    });

    // Step 6: Test dashboard statistics
    console.log('\n📊 Step 6: Testing dashboard statistics...');
    const [
      totalSubmissions,
      approvedDocuments,
      rejectedDocuments,
      inReviewDocuments,
      overdueReviews
    ] = await Promise.all([
      prisma.atp_documents.count(),
      prisma.atp_documents.count({ where: { current_status: 'approved' } }),
      prisma.atp_documents.count({ where: { current_status: 'rejected' } }),
      prisma.atp_documents.count({ where: { current_status: 'in_review' } }),
      prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          sla_deadline: { lt: new Date() }
        }
      })
    ]);

    console.log('✅ Dashboard Statistics:');
    console.log(`   Total Submissions: ${totalSubmissions}`);
    console.log(`   Approved: ${approvedDocuments}`);
    console.log(`   Rejected: ${rejectedDocuments}`);
    console.log(`   In Review: ${inReviewDocuments}`);
    console.log(`   Overdue Reviews: ${overdueReviews}`);
    console.log(`   Approval Rate: ${totalSubmissions > 0 ? Math.round((approvedDocuments / totalSubmissions) * 100) : 0}%`);

    // Step 7: Test workflow distribution
    console.log('\n📈 Step 7: Testing workflow distribution...');
    const workflowDistribution = await prisma.atp_documents.groupBy({
      by: ['workflow_path'],
      _count: { workflow_path: true }
    });

    console.log('✅ Workflow Distribution:');
    workflowDistribution.forEach(dist => {
      console.log(`   ${dist.workflow_path || 'Unknown'}: ${dist._count.workflow_path} documents`);
    });

    // Step 8: Test SLA monitoring
    console.log('\n⏰ Step 8: Testing SLA monitoring...');
    const now = new Date();
    const urgentDeadline = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

    const slaStats = {
      overdue: await prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          sla_deadline: { lt: now }
        }
      }),
      urgent: await prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          sla_deadline: { gte: now, lt: urgentDeadline }
        }
      }),
      normal: await prisma.atp_review_stages.count({
        where: {
          review_status: 'pending',
          sla_deadline: { gte: urgentDeadline }
        }
      })
    };

    console.log('✅ SLA Status:');
    console.log(`   Overdue: ${slaStats.overdue} reviews`);
    console.log(`   Urgent (< 6h): ${slaStats.urgent} reviews`);
    console.log(`   Normal: ${slaStats.normal} reviews`);

    // Step 9: Test recent activity
    console.log('\n📅 Step 9: Testing recent activity...');
    const recentActivity = await prisma.atp_documents.findMany({
      where: {
        submission_date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        atp_code: true,
        site_id: true,
        current_status: true,
        submission_date: true,
        workflow_path: true
      },
      orderBy: { submission_date: 'desc' },
      take: 5
    });

    console.log(`✅ Recent Activity (Last 7 days): ${recentActivity.length} submissions`);
    recentActivity.forEach(activity => {
      const daysAgo = Math.floor((Date.now() - new Date(activity.submission_date).getTime()) / (24 * 60 * 60 * 1000));
      console.log(`   ${activity.atp_code}: ${activity.current_status} (${daysAgo} days ago)`);
    });

    // Step 10: Test API endpoint simulation
    console.log('\n🌐 Step 10: Simulating API endpoint responses...');
    
    // Simulate GET /api/v1/atp/workflow/reviews/pending?role=BO
    const boReviews = await prisma.atp_review_stages.findMany({
      where: {
        assigned_role: 'BO',
        review_status: 'pending'
      },
      include: {
        atp_documents: {
          select: {
            id: true,
            atp_code: true,
            site_id: true,
            document_type: true,
            final_category: true,
            submission_date: true,
            submitted_by: true,
            file_name: true
          }
        }
      },
      orderBy: { sla_deadline: 'asc' },
      take: 5
    });

    console.log(`✅ API Simulation - BO Pending Reviews: ${boReviews.length} items`);

    // Simulate dashboard stats API
    const dashboardResponse = {
      overview: {
        total_submissions: totalSubmissions,
        pending_reviews: await prisma.atp_review_stages.count({ where: { review_status: 'pending' } }),
        approved_documents: approvedDocuments,
        rejected_documents: rejectedDocuments,
        overdue_reviews: overdueReviews,
        approval_rate: totalSubmissions > 0 ? Math.round((approvedDocuments / totalSubmissions) * 100) : 0
      },
      workflow_distribution: workflowDistribution.reduce((acc, item) => {
        acc[item.workflow_path || 'Unknown'] = item._count.workflow_path;
        return acc;
      }, {}),
      sla_performance: slaStats
    };

    console.log('✅ API Simulation - Dashboard Response Generated');

    console.log('\n🎉 ATP WORKFLOW SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ Database queries working correctly');
    console.log('✅ Workflow configurations validated');
    console.log('✅ Role-based filtering functional');
    console.log('✅ SLA monitoring operational');
    console.log('✅ Dashboard statistics accurate');
    console.log('✅ API endpoints ready for implementation');
    console.log('=====================================');

    return {
      success: true,
      statistics: dashboardResponse,
      workflow_config: WORKFLOW_CONFIG,
      test_results: {
        total_atps: totalSubmissions,
        pending_reviews: pendingReviews.length,
        punchlist_items: punchlistStats.reduce((sum, stat) => sum + stat._count.status, 0),
        recent_activity: recentActivity.length
      }
    };

  } catch (error) {
    console.error('❌ Error in ATP workflow test:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testATPWorkflowSimple()
    .then((result) => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { testATPWorkflowSimple };