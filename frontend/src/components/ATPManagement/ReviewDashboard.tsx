import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, FileText, User, Calendar } from 'lucide-react';

interface ATPDocument {
  id: string;
  atp_code: string;
  site_id: string;
  document_type: string;
  current_stage: string;
  current_status: string;
  submission_date: string;
  atp_review_stages: ReviewStage[];
}

interface ReviewStage {
  id: string;
  stage_number: number;
  stage_code: string;
  stage_name: string;
  assigned_role: string;
  review_status: string;
  sla_deadline: string;
  reviewer_id?: string;
  decision?: string;
  comments?: string;
  review_completed_at?: string;
}

interface ReviewDashboardProps {
  userRole: string;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ userRole }) => {
  const [pendingReviews, setPendingReviews] = useState<ATPDocument[]>([]);
  const [completedReviews, setCompletedReviews] = useState<ATPDocument[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    reviewedToday: 0,
    approvedWeek: 0,
    rejectedWeek: 0
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [userRole]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/v1/atp/reviews/pending?role=${userRole}`);
      const pendingData = await response.json();
      
      const completedResponse = await fetch(`/api/v1/atp/reviews/completed?role=${userRole}`);
      const completedData = await completedResponse.json();
      
      setPendingReviews(pendingData || []);
      setCompletedReviews(completedData || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/v1/atp/reviews/stats?role=${userRole}`);
      const data = await response.json();
      setStats(data || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'approved_with_punchlist':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 'text-red-600 bg-red-50'; // Overdue
    if (hoursUntilDue < 24) return 'text-orange-600 bg-orange-50'; // Due today
    return 'text-green-600 bg-green-50'; // Normal
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 'Overdue';
    if (hoursUntilDue < 24) return `${Math.floor(hoursUntilDue)}h remaining`;
    return `${Math.floor(hoursUntilDue / 24)}d remaining`;
  };

  const handleReviewClick = (atpId: string) => {
    window.location.href = `/atp-management/review/${atpId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-blue-600" />
            ATP Review Dashboard - {userRole}
          </h1>
          <p className="text-gray-600 mt-1">Review and approve ATP documents</p>
        </div>

        {/* Statistics Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Reviewed Today</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.reviewedToday}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Approved This Week</p>
                  <p className="text-2xl font-bold text-green-900">{stats.approvedWeek}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Rejected This Week</p>
                  <p className="text-2xl font-bold text-red-900">{stats.rejectedWeek}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Reviews ({pendingReviews.length})
              </button>
              <button
                onClick={() => setSelectedTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Reviews ({completedReviews.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Review List */}
        <div className="p-6">
          {selectedTab === 'pending' && (
            <div className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reviews</h3>
                  <p className="mt-1 text-sm text-gray-500">All ATP documents have been reviewed.</p>
                </div>
              ) : (
                pendingReviews.map((atp) => {
                  const currentStage = atp.atp_review_stages.find(stage => stage.review_status === 'pending');
                  return (
                    <div key={atp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{atp.atp_code}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              atp.document_type === 'hardware' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {atp.document_type?.toUpperCase()}
                            </span>
                            {currentStage && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(currentStage.sla_deadline)}`}>
                                {formatTimeRemaining(currentStage.sla_deadline)}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Site: {atp.site_id}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Submitted: {new Date(atp.submission_date).toLocaleDateString()}
                            </div>
                            {currentStage && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                Stage: {currentStage.stage_name}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(atp.current_status)}
                          <button
                            onClick={() => handleReviewClick(atp.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {selectedTab === 'completed' && (
            <div className="space-y-4">
              {completedReviews.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No completed reviews</h3>
                  <p className="mt-1 text-sm text-gray-500">Completed reviews will appear here.</p>
                </div>
              ) : (
                completedReviews.map((atp) => {
                  const completedStage = atp.atp_review_stages.find(stage => 
                    stage.assigned_role === userRole && stage.review_status === 'completed'
                  );
                  return (
                    <div key={atp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{atp.atp_code}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              atp.document_type === 'hardware' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {atp.document_type?.toUpperCase()}
                            </span>
                            {completedStage && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                completedStage.decision === 'approve' ? 'bg-green-100 text-green-800' :
                                completedStage.decision === 'reject' ? 'bg-red-100 text-red-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {completedStage.decision?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Site: {atp.site_id}
                            </div>
                            {completedStage && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Reviewed: {new Date(completedStage.review_completed_at || '').toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          {completedStage?.comments && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Comments:</strong> {completedStage.comments}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(completedStage?.decision || 'pending')}
                          <button
                            onClick={() => handleReviewClick(atp.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDashboard;