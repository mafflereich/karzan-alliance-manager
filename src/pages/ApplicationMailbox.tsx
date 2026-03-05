import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Plus, 
  Send,
  AlertCircle,
  Clock,
  Trash2,
  HelpCircle,
  User
} from 'lucide-react';
import { ApplyMail } from '../types';
import { formatDate } from '../utils';

type ApplicationSubject = 'leave' | 'tier_change' | 'reserved_seat' | 'id_change' | 'other';
type ApplicationStatus = 'pending' | 'acknowledged' | 'rejected' | 'discuss' | 'unclear' | 'who_are_you';

export default function ApplicationMailbox() {
  const { t } = useTranslation();
  const { currentUser, db, fetchApplyMails, addApplyMail, updateApplyMail, deleteApplyMail, showToast } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [formData, setFormData] = useState({
    subject: 'leave' as ApplicationSubject,
    content: ''
  });

  useEffect(() => {
    fetchApplyMails();
  }, []);

  const applications = Object.values(db.applyMails || {}).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const userRole = currentUser ? db.users[currentUser]?.role : null;
  const isPrivileged = userRole === 'creator' || userRole === 'admin' || userRole === 'manager';

  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const currentApplications = applications.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const getSubjectLabel = (subject: string) => {
    switch (subject) {
      case 'leave': return t('mailbox.subject_leave', '請假');
      case 'tier_change': return t('mailbox.subject_tier_change', '升降梯隊');
      case 'reserved_seat': return t('mailbox.subject_reserved_seat', '保留席');
      case 'id_change': return t('mailbox.subject_id_change', 'ID更改/修正');
      case 'other': return t('mailbox.subject_other', '其他');
      default: return subject;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return (
          <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_acknowledged', '已知悉')}</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_rejected', '拒絕')}</span>
          </div>
        );
      case 'discuss':
        return (
          <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_discuss', '請聯絡總長')}</span>
          </div>
        );
      case 'unclear':
        return (
          <div className="flex items-center justify-center gap-1.5 text-purple-600 dark:text-purple-400">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_unclear', '意義不明')}</span>
          </div>
        );
      case 'who_are_you':
        return (
          <div className="flex items-center justify-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <User className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_who_are_you', '你是誰？')}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center gap-1.5 text-stone-400 dark:text-stone-500">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium">{t('mailbox.status_pending', '待處理')}</span>
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lastSubmitTime = localStorage.getItem('last_application_submit_time');
    if (lastSubmitTime) {
      const timeDiff = Date.now() - parseInt(lastSubmitTime, 10);
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        showToast(t('mailbox.submit_cooldown', '您剛剛提交了申請，請稍後再試。'), 'error');
        return;
      }
    }

    try {
      await addApplyMail(formData.subject, formData.content);
      localStorage.setItem('last_application_submit_time', Date.now().toString());
      setIsModalOpen(false);
      setFormData({ subject: 'leave', content: '' });
      showToast(t('common.submit_success', '提交成功'), 'success');
    } catch (err) {
      showToast(t('common.submit_failed', '提交失敗'), 'error');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplyMail(id, { status: newStatus });
      showToast(t('common.update_success', '更新成功'), 'success');
    } catch (err) {
      showToast(t('common.update_failed', '更新失敗'), 'error');
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteApplyMail(itemToDelete);
      showToast(t('common.delete_success', '刪除成功'), 'success');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      showToast(t('common.delete_failed', '刪除失敗'), 'error');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-600" />
            {t('mailbox.title', '申請信箱')}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('mailbox.submit_application', '提出申請')}
          </button>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-600">
                  <th className="p-4 font-semibold w-48">{t('mailbox.date', '申請日期')}</th>
                  <th className="p-4 font-semibold w-32">{t('mailbox.subject', '主題')}</th>
                  <th className="p-4 font-semibold">{t('mailbox.content', '內容')}</th>
                  <th className="p-4 font-semibold w-48 text-center">{t('mailbox.reply', '回覆')}</th>
                  {isPrivileged && <th className="p-4 font-semibold w-32 text-center">{t('common.actions', '操作')}</th>}
                </tr>
              </thead>
              <tbody>
                {currentApplications.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr 
                      className="border-b border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(app.id)}
                    >
                      <td className="p-4 text-sm text-stone-500 dark:text-stone-400 font-mono">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                          ${app.subject === 'leave' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            app.subject === 'tier_change' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            app.subject === 'reserved_seat' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                            app.subject === 'id_change' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300'
                          }`}>
                          {getSubjectLabel(app.subject)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                          <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[200px] block" title={app.content}>{app.content.split('\n')[0]}</span>
                          {expandedId === app.id ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusDisplay(app.status)}
                      </td>
                      {isPrivileged && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center items-center gap-2">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusUpdate(app.id, e.target.value as ApplicationStatus)}
                              className="text-xs p-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 dark:text-stone-200 outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="pending">{t('mailbox.status_pending', '待處理')}</option>
                              <option value="acknowledged">{t('mailbox.status_acknowledged', '已知悉')}</option>
                              <option value="rejected">{t('mailbox.status_rejected', '拒絕')}</option>
                              <option value="discuss">{t('mailbox.status_discuss', '請聯絡總長')}</option>
                              <option value="unclear">{t('mailbox.status_unclear', '意義不明')}</option>
                              <option value="who_are_you">{t('mailbox.status_who_are_you', '你是誰？')}</option>
                            </select>
                            <button
                              onClick={(e) => handleDeleteClick(app.id, e)}
                              className="p-1 text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title={t('common.delete', '刪除')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedId === app.id && (
                      <tr className="bg-stone-50 dark:bg-stone-700/30">
                        <td colSpan={isPrivileged ? 5 : 4} className="p-4 border-b border-stone-100 dark:border-stone-700">
                          <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-stone-200 dark:border-stone-600 whitespace-pre-wrap text-stone-700 dark:text-stone-300">
                            {app.content}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {currentApplications.map((app) => (
              <div 
                key={app.id}
                className="p-4 border-b border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                onClick={() => toggleExpand(app.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                      {formatDate(app.createdAt)}
                    </span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium self-start
                      ${app.subject === 'leave' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        app.subject === 'tier_change' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        app.subject === 'reserved_seat' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        app.subject === 'id_change' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300'
                      }`}>
                      {getSubjectLabel(app.subject)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusDisplay(app.status)}
                    {expandedId === app.id ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-stone-800 dark:text-stone-200 line-clamp-2">
                    {app.content}
                  </p>
                </div>

                {expandedId === app.id && (
                  <div className="mt-3 mb-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap border border-stone-100 dark:border-stone-700">
                    {app.content}
                  </div>
                )}

                {isPrivileged && (
                  <div className="flex justify-end items-center gap-3 mt-2 pt-2 border-t border-stone-100 dark:border-stone-700" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{t('common.actions', '操作')}:</span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value as ApplicationStatus)}
                      className="text-xs p-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 dark:text-stone-200 outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="pending">{t('mailbox.status_pending', '待處理')}</option>
                      <option value="acknowledged">{t('mailbox.status_acknowledged', '已知悉')}</option>
                      <option value="rejected">{t('mailbox.status_rejected', '拒絕')}</option>
                      <option value="discuss">{t('mailbox.status_discuss', '請聯絡總長')}</option>
                      <option value="unclear">{t('mailbox.status_unclear', '意義不明')}</option>
                      <option value="who_are_you">{t('mailbox.status_who_are_you', '你是誰？')}</option>
                    </select>
                    <button
                      onClick={(e) => handleDeleteClick(app.id, e)}
                      className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-stone-100 dark:bg-stone-700 rounded"
                      title={t('common.delete', '刪除')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-stone-200 dark:border-stone-600 flex justify-between items-center">
            <div className="text-sm text-stone-500 dark:text-stone-400">
              {t('common.page', '頁碼')} {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-stone-100 dark:bg-stone-700 rounded hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-50 transition-colors"
              >
                {t('common.prev_page', '上一頁')}
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-stone-100 dark:bg-stone-700 rounded hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-50 transition-colors"
              >
                {t('common.next_page', '下一頁')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">
                {t('mailbox.submit_application', '提出申請')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{t('mailbox.submit_hint', '請在內容中註明您的公會名稱和遊戲暱稱，以便管理員處理。')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('mailbox.subject', '主題')}
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value as ApplicationSubject})}
                  className="w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none dark:bg-stone-700 dark:text-stone-100"
                >
                  <option value="leave">{t('mailbox.subject_leave', '請假')}</option>
                  <option value="tier_change">{t('mailbox.subject_tier_change', '升降梯隊')}</option>
                  <option value="reserved_seat">{t('mailbox.subject_reserved_seat', '保留席')}</option>
                  <option value="id_change">{t('mailbox.subject_id_change', 'ID更改/修正')}</option>
                  <option value="other">{t('mailbox.subject_other', '其他')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('mailbox.content', '內容')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                  rows={6}
                  maxLength={500}
                  placeholder={t('mailbox.content_placeholder', '請輸入申請內容...')}
                  className="w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none dark:bg-stone-700 dark:text-stone-100 resize-none"
                />
                <div className="text-right text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {formData.content.length}/500
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  {t('common.cancel', '取消')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  {t('common.submit', '送出')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-2">
                {t('common.confirm_delete', '確認刪除')}
              </h3>
              <p className="text-stone-600 dark:text-stone-400 mb-6">
                {t('mailbox.delete_confirm_msg', '確定要刪除此申請嗎？此動作無法復原。')}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  {t('common.cancel', '取消')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  {t('common.delete', '刪除')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
