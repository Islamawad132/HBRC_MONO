import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { settingsService } from '../../services/settings.service';
import type {
  TestType,
  SampleType,
  Standard,
  PriceList,
  DistanceRate,
  MixerType,
  LookupCategory,
} from '../../types/interfaces';
import {
  ServiceCategory,
  ServiceCategoryLabels,
  StandardType,
  StandardTypeLabels,
  getLabel,
} from '../../types/enums';
import { Modal, InputField, SelectField, TextareaField, CheckboxField, Button } from '../../components/ui';
import {
  Settings,
  FlaskConical,
  TestTube,
  BookOpen,
  DollarSign,
  Truck,
  Beaker,
  Database,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
} from 'lucide-react';

// Tab configuration
type TabKey = 'testTypes' | 'sampleTypes' | 'standards' | 'priceLists' | 'distanceRates' | 'mixerTypes' | 'lookupCategories';

interface Tab {
  key: TabKey;
  icon: React.ReactNode;
  color: string;
}

const tabs: Tab[] = [
  { key: 'testTypes', icon: <FlaskConical className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
  { key: 'sampleTypes', icon: <TestTube className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { key: 'standards', icon: <BookOpen className="h-4 w-4" />, color: 'from-green-500 to-green-600' },
  { key: 'priceLists', icon: <DollarSign className="h-4 w-4" />, color: 'from-yellow-500 to-yellow-600' },
  { key: 'distanceRates', icon: <Truck className="h-4 w-4" />, color: 'from-orange-500 to-orange-600' },
  { key: 'mixerTypes', icon: <Beaker className="h-4 w-4" />, color: 'from-cyan-500 to-cyan-600' },
  { key: 'lookupCategories', icon: <Database className="h-4 w-4" />, color: 'from-indigo-500 to-indigo-600' },
];

export function AdminSettingsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('testTypes');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Data state
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [distanceRates, setDistanceRates] = useState<DistanceRate[]>([]);
  const [mixerTypes, setMixerTypes] = useState<MixerType[]>([]);
  const [lookupCategories, setLookupCategories] = useState<LookupCategory[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'testTypes':
          setTestTypes(await settingsService.getTestTypes(showInactive));
          break;
        case 'sampleTypes':
          setSampleTypes(await settingsService.getSampleTypes(undefined, showInactive));
          break;
        case 'standards':
          setStandards(await settingsService.getStandards(undefined, showInactive));
          break;
        case 'priceLists':
          setPriceLists(await settingsService.getPriceLists(undefined, showInactive));
          break;
        case 'distanceRates':
          setDistanceRates(await settingsService.getDistanceRates(showInactive));
          break;
        case 'mixerTypes':
          setMixerTypes(await settingsService.getMixerTypes(showInactive));
          break;
        case 'lookupCategories':
          setLookupCategories(await settingsService.getLookupCategories(showInactive));
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, showInactive, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data based on search query
  const filterData = <T extends { name: string; nameAr: string; code?: string }>(data: T[]): T[] => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.nameAr.includes(query) ||
        (item.code && item.code.toLowerCase().includes(query))
    );
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'testTypes':
        return filterData(testTypes);
      case 'sampleTypes':
        return filterData(sampleTypes);
      case 'standards':
        return filterData(standards);
      case 'priceLists':
        return filterData(priceLists);
      case 'distanceRates':
        return distanceRates.filter((item) => {
          if (!searchQuery) return true;
          return (
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.descriptionAr?.includes(searchQuery)
          );
        });
      case 'mixerTypes':
        return filterData(mixerTypes);
      case 'lookupCategories':
        return filterData(lookupCategories);
      default:
        return [];
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case 'testTypes':
          await settingsService.deleteTestType(deletingItem.id);
          break;
        case 'sampleTypes':
          await settingsService.deleteSampleType(deletingItem.id);
          break;
        case 'standards':
          await settingsService.deleteStandard(deletingItem.id);
          break;
        case 'priceLists':
          await settingsService.deletePriceList(deletingItem.id);
          break;
        case 'distanceRates':
          await settingsService.deleteDistanceRate(deletingItem.id);
          break;
        case 'mixerTypes':
          await settingsService.deleteMixerType(deletingItem.id);
          break;
        case 'lookupCategories':
          await settingsService.deleteLookupCategory(deletingItem.id);
          break;
      }
      toast.success(t('adminSettings.deleteSuccess'));
      setShowDeleteModal(false);
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <Settings className="h-5 w-5 text-white" />
            </div>
            {t('adminSettings.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('adminSettings.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="glass-button flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('adminSettings.add')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'text-theme-muted hover:text-theme-primary hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{t(`adminSettings.tabs.${tab.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted ltr:left-3 rtl:right-3" />
            <input
              type="text"
              placeholder={t('adminSettings.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full ltr:pl-10 rtl:pr-10"
            />
          </div>

          {/* Show Inactive Toggle */}
          <button
              onClick={() => setShowInactive(!showInactive)}
              className={`glass-button flex items-center gap-2 px-4 py-2 ${
                showInactive ? 'ring-2 ring-[#d4a84b]/50' : ''
              }`}
            >
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{t('adminSettings.showInactive')}</span>
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a84b]" />
          </div>
        ) : getCurrentData().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Settings className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('adminSettings.noData')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('adminSettings.noDataDescription')}</p>
          </div>
        ) : (
          <DataTable
            activeTab={activeTab}
            data={getCurrentData()}
            isRTL={isRTL}
            onEdit={(item) => {
              setEditingItem(item);
              setShowModal(true);
            }}
            onDelete={(item) => {
              setDeletingItem(item);
              setShowDeleteModal(true);
            }}
            testTypes={testTypes}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <SettingsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          activeTab={activeTab}
          editingItem={editingItem}
          testTypes={testTypes}
          onSuccess={() => {
            setShowModal(false);
            setEditingItem(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('adminSettings.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('adminSettings.deleteConfirmMessage')}</p>
              <p className="mt-1 font-medium text-theme-primary">
                {isRTL ? deletingItem.nameAr || deletingItem.labelAr || deletingItem.key : deletingItem.name || deletingItem.label || deletingItem.key}
              </p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingItem(null);
                }}
                className="flex-1 glass-button py-2"
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Data Table Component
interface DataTableProps {
  activeTab: TabKey;
  data: any[];
  isRTL: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  testTypes: TestType[];
}

function DataTable({ activeTab, data, isRTL, onEdit, onDelete, testTypes }: DataTableProps) {
  const { t } = useTranslation();

  const getColumns = (): { key: string; label: string; render?: (item: any) => React.ReactNode }[] => {
    switch (activeTab) {
      case 'testTypes':
        return [
          { key: 'name', label: t('adminSettings.testTypes.name') },
          { key: 'code', label: t('adminSettings.testTypes.code') },
          {
            key: 'category',
            label: t('adminSettings.testTypes.category'),
            render: (item) => getLabel(ServiceCategoryLabels, item.category, isRTL ? 'ar' : 'en'),
          },
          {
            key: 'basePrice',
            label: t('adminSettings.testTypes.basePrice'),
            render: (item) => (item.basePrice ? `${item.basePrice.toLocaleString()} EGP` : '-'),
          },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'sampleTypes':
        return [
          { key: 'name', label: t('adminSettings.sampleTypes.name') },
          { key: 'code', label: t('adminSettings.sampleTypes.code') },
          {
            key: 'testType',
            label: t('adminSettings.sampleTypes.testType'),
            render: (item) => {
              const testType = testTypes.find((tt) => tt.id === item.testTypeId);
              return testType ? (isRTL ? testType.nameAr : testType.name) : '-';
            },
          },
          { key: 'unit', label: t('adminSettings.sampleTypes.unit'), render: (item) => (isRTL ? item.unitAr : item.unit) },
          {
            key: 'pricePerUnit',
            label: t('adminSettings.sampleTypes.pricePerUnit'),
            render: (item) => (item.pricePerUnit ? `${item.pricePerUnit.toLocaleString()} EGP` : '-'),
          },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'standards':
        return [
          { key: 'name', label: t('adminSettings.standards.name') },
          { key: 'code', label: t('adminSettings.standards.code') },
          {
            key: 'type',
            label: t('adminSettings.standards.type'),
            render: (item) => getLabel(StandardTypeLabels, item.type, isRTL ? 'ar' : 'en'),
          },
          { key: 'version', label: t('adminSettings.standards.version') },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'priceLists':
        return [
          { key: 'name', label: t('adminSettings.priceLists.name') },
          { key: 'code', label: t('adminSettings.priceLists.code') },
          {
            key: 'category',
            label: t('adminSettings.priceLists.category'),
            render: (item) => getLabel(ServiceCategoryLabels, item.category, isRTL ? 'ar' : 'en'),
          },
          {
            key: 'validFrom',
            label: t('adminSettings.priceLists.validFrom'),
            render: (item) => new Date(item.validFrom).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US'),
          },
          {
            key: 'isDefault',
            label: t('adminSettings.priceLists.isDefault'),
            render: (item) => (
              item.isDefault ? (
                <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-500/30">
                  {isRTL ? 'افتراضي' : 'Default'}
                </span>
              ) : '-'
            ),
          },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'distanceRates':
        return [
          {
            key: 'range',
            label: t('adminSettings.distanceRates.range'),
            render: (item) => `${item.fromKm} - ${item.toKm} km`,
          },
          {
            key: 'rate',
            label: t('adminSettings.distanceRates.rate'),
            render: (item) => `${item.rate.toLocaleString()} EGP`,
          },
          {
            key: 'ratePerKm',
            label: t('adminSettings.distanceRates.ratePerKm'),
            render: (item) => (item.ratePerKm ? `${item.ratePerKm.toLocaleString()} EGP/km` : '-'),
          },
          { key: 'description', label: t('adminSettings.distanceRates.description'), render: (item) => (isRTL ? item.descriptionAr : item.description) || '-' },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'mixerTypes':
        return [
          { key: 'name', label: t('adminSettings.mixerTypes.name') },
          { key: 'code', label: t('adminSettings.mixerTypes.code') },
          {
            key: 'capacity',
            label: t('adminSettings.mixerTypes.capacity'),
            render: (item) => item.capacity ? `${item.capacity} ${isRTL ? item.capacityUnitAr : item.capacityUnit}` : '-',
          },
          {
            key: 'pricePerBatch',
            label: t('adminSettings.mixerTypes.pricePerBatch'),
            render: (item) => (item.pricePerBatch ? `${item.pricePerBatch.toLocaleString()} EGP` : '-'),
          },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      case 'lookupCategories':
        return [
          { key: 'name', label: t('adminSettings.lookupCategories.name') },
          { key: 'code', label: t('adminSettings.lookupCategories.code') },
          {
            key: 'itemsCount',
            label: t('adminSettings.lookupCategories.itemsCount'),
            render: (item) => item.items?.length || 0,
          },
          {
            key: 'isSystem',
            label: t('adminSettings.lookupCategories.isSystem'),
            render: (item) => (
              item.isSystem ? (
                <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400 border border-purple-500/30">
                  {isRTL ? 'نظام' : 'System'}
                </span>
              ) : '-'
            ),
          },
          {
            key: 'isActive',
            label: t('adminSettings.common.status'),
            render: (item) => <StatusBadge isActive={item.isActive} />,
          },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                {t('adminSettings.common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {data.map((item) => (
              <tr key={item.id || item.key} className="group transition-colors hover:bg-theme-bg-secondary/30">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-theme-primary">
                    {col.render ? col.render(item) : (isRTL && item[col.key + 'Ar'] ? item[col.key + 'Ar'] : item[col.key]) || '-'}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                      title={t('common.edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      disabled={activeTab === 'lookupCategories' && item.isSystem}
                      className={`rounded-lg p-2 text-theme-muted transition-colors ${
                        activeTab === 'lookupCategories' && item.isSystem
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-red-500/10 hover:text-red-400'
                      }`}
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-theme-border">
        {data.map((item) => (
          <div key={item.id || item.key} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-theme-primary">
                  {isRTL ? (item.nameAr || item.labelAr) : (item.name || item.label)}
                </p>
                <p className="text-xs text-theme-muted">{item.code || item.key}</p>
              </div>
              {item.isActive !== undefined && <StatusBadge isActive={item.isActive} />}
            </div>
            <div className="flex items-center justify-end gap-1 pt-2 border-t border-theme-border">
              <button
                onClick={() => onEdit(item)}
                className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                disabled={activeTab === 'lookupCategories' && item.isSystem}
                className={`rounded-lg p-2 text-theme-muted ${
                  activeTab === 'lookupCategories' && item.isSystem
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:text-red-400'
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between border-t border-theme-border px-4 py-3">
        <p className="text-sm text-theme-muted">
          {t('adminSettings.showing')} {data.length} {t('adminSettings.items')}
        </p>
      </div>
    </>
  );
}

// Status Badge Component
function StatusBadge({ isActive }: { isActive: boolean }) {
  const { language } = useSettings();
  const isRTL = language === 'ar';

  return isActive ? (
    <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/30">
      {isRTL ? 'نشط' : 'Active'}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-400 border border-gray-500/30">
      {isRTL ? 'غير نشط' : 'Inactive'}
    </span>
  );
}

// Settings Modal Component
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  editingItem: any;
  testTypes: TestType[];
  onSuccess: () => void;
}

function SettingsModal({ isOpen, onClose, activeTab, editingItem, testTypes, onSuccess }: SettingsModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!editingItem;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data based on tab and editing item
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        // Default values based on tab
        switch (activeTab) {
          case 'testTypes':
            setFormData({
              name: '',
              nameAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              category: ServiceCategory.LAB_TESTS,
              basePrice: '',
              isActive: true,
              sortOrder: 0,
            });
            break;
          case 'sampleTypes':
            setFormData({
              name: '',
              nameAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              testTypeId: '',
              unit: 'piece',
              unitAr: 'قطعة',
              minQuantity: 1,
              maxQuantity: '',
              pricePerUnit: '',
              isActive: true,
              sortOrder: 0,
            });
            break;
          case 'standards':
            setFormData({
              name: '',
              nameAr: '',
              title: '',
              titleAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              type: StandardType.EGYPTIAN,
              documentUrl: '',
              version: '',
              publishedYear: '',
              isActive: true,
              sortOrder: 0,
            });
            break;
          case 'priceLists':
            setFormData({
              name: '',
              nameAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              category: ServiceCategory.LAB_TESTS,
              validFrom: new Date().toISOString().split('T')[0],
              validTo: '',
              isActive: true,
              isDefault: false,
            });
            break;
          case 'distanceRates':
            setFormData({
              fromKm: 0,
              toKm: '',
              rate: '',
              ratePerKm: '',
              description: '',
              descriptionAr: '',
              isActive: true,
              sortOrder: 0,
            });
            break;
          case 'mixerTypes':
            setFormData({
              name: '',
              nameAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              capacity: '',
              capacityUnit: 'm³',
              capacityUnitAr: 'م³',
              pricePerBatch: '',
              isActive: true,
              sortOrder: 0,
            });
            break;
          case 'lookupCategories':
            setFormData({
              name: '',
              nameAr: '',
              description: '',
              descriptionAr: '',
              code: '',
              isActive: true,
              isSystem: false,
            });
            break;
        }
      }
      setErrors({});
    }
  }, [isOpen, editingItem, activeTab]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (activeTab) {
      case 'testTypes':
      case 'sampleTypes':
      case 'standards':
      case 'priceLists':
      case 'mixerTypes':
      case 'lookupCategories':
        if (!formData.name?.trim()) newErrors.name = t('validation.required');
        if (!formData.nameAr?.trim()) newErrors.nameAr = t('validation.required');
        if (!formData.code?.trim()) newErrors.code = t('validation.required');
        break;
      case 'distanceRates':
        if (formData.fromKm === '' || formData.fromKm === undefined) newErrors.fromKm = t('validation.required');
        if (formData.toKm === '' || formData.toKm === undefined) newErrors.toKm = t('validation.required');
        if (formData.rate === '' || formData.rate === undefined) newErrors.rate = t('validation.required');
        break;
    }

    if (activeTab === 'sampleTypes' && !formData.testTypeId) {
      newErrors.testTypeId = t('validation.required');
    }

    if (activeTab === 'standards') {
      if (!formData.title?.trim()) newErrors.title = t('validation.required');
      if (!formData.titleAr?.trim()) newErrors.titleAr = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = { ...formData };

      // Clean up numeric fields
      if (data.basePrice === '') delete data.basePrice;
      else if (data.basePrice) data.basePrice = parseFloat(data.basePrice);

      if (data.pricePerUnit === '') delete data.pricePerUnit;
      else if (data.pricePerUnit) data.pricePerUnit = parseFloat(data.pricePerUnit);

      if (data.pricePerBatch === '') delete data.pricePerBatch;
      else if (data.pricePerBatch) data.pricePerBatch = parseFloat(data.pricePerBatch);

      if (data.rate !== undefined && data.rate !== '') data.rate = parseFloat(data.rate);
      if (data.ratePerKm === '') delete data.ratePerKm;
      else if (data.ratePerKm) data.ratePerKm = parseFloat(data.ratePerKm);

      if (data.fromKm !== undefined) data.fromKm = parseFloat(data.fromKm);
      if (data.toKm !== undefined && data.toKm !== '') data.toKm = parseFloat(data.toKm);

      if (data.capacity === '') delete data.capacity;
      else if (data.capacity) data.capacity = parseFloat(data.capacity);

      if (data.minQuantity !== undefined) data.minQuantity = parseInt(data.minQuantity);
      if (data.maxQuantity === '') delete data.maxQuantity;
      else if (data.maxQuantity) data.maxQuantity = parseInt(data.maxQuantity);

      if (data.publishedYear === '') delete data.publishedYear;
      else if (data.publishedYear) data.publishedYear = parseInt(data.publishedYear);

      if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;

      if (data.validTo === '') delete data.validTo;

      // Remove id for create, keep for update
      if (!isEditMode) {
        delete data.id;
        delete data.createdAt;
        delete data.updatedAt;
      }

      switch (activeTab) {
        case 'testTypes':
          if (isEditMode) {
            await settingsService.updateTestType(editingItem.id, data);
          } else {
            await settingsService.createTestType(data);
          }
          break;
        case 'sampleTypes':
          if (isEditMode) {
            await settingsService.updateSampleType(editingItem.id, data);
          } else {
            await settingsService.createSampleType(data);
          }
          break;
        case 'standards':
          if (isEditMode) {
            await settingsService.updateStandard(editingItem.id, data);
          } else {
            await settingsService.createStandard(data);
          }
          break;
        case 'priceLists':
          if (isEditMode) {
            await settingsService.updatePriceList(editingItem.id, data);
          } else {
            await settingsService.createPriceList(data);
          }
          break;
        case 'distanceRates':
          if (isEditMode) {
            await settingsService.updateDistanceRate(editingItem.id, data);
          } else {
            await settingsService.createDistanceRate(data);
          }
          break;
        case 'mixerTypes':
          if (isEditMode) {
            await settingsService.updateMixerType(editingItem.id, data);
          } else {
            await settingsService.createMixerType(data);
          }
          break;
        case 'lookupCategories':
          if (isEditMode) {
            await settingsService.updateLookupCategory(editingItem.id, data);
          } else {
            await settingsService.createLookupCategory(data);
          }
          break;
      }

      toast.success(isEditMode ? t('adminSettings.updateSuccess') : t('adminSettings.createSuccess'));
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const action = isEditMode ? t('common.edit') : t('common.create');
    return `${action} ${t(`adminSettings.tabs.${activeTab}`)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Dynamic Form Fields based on activeTab */}
        {activeTab === 'testTypes' && (
          <TestTypeForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} />
        )}
        {activeTab === 'sampleTypes' && (
          <SampleTypeForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} testTypes={testTypes} />
        )}
        {activeTab === 'standards' && (
          <StandardForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} />
        )}
        {activeTab === 'priceLists' && (
          <PriceListForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} />
        )}
        {activeTab === 'distanceRates' && (
          <DistanceRateForm formData={formData} errors={errors} onChange={handleChange} />
        )}
        {activeTab === 'mixerTypes' && (
          <MixerTypeForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} />
        )}
        {activeTab === 'lookupCategories' && (
          <LookupCategoryForm formData={formData} errors={errors} onChange={handleChange} isEditMode={isEditMode} />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} icon={<X className="h-4 w-4" />}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<Save className="h-4 w-4" />}>
            {isEditMode ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Form Components for each type
interface FormProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  isEditMode?: boolean;
}

function TestTypeForm({ formData, errors, onChange, isEditMode }: FormProps) {
  const { t } = useTranslation();
  const { language } = useSettings();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.testTypes.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.testTypes.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.testTypes.code')}
          value={formData.code || ''}
          onChange={(e) => onChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          required
          disabled={isEditMode}
          dir="ltr"
        />
        <SelectField
          label={t('adminSettings.testTypes.category')}
          value={formData.category || ServiceCategory.LAB_TESTS}
          onChange={(e) => onChange('category', e.target.value)}
          required
        >
          {Object.values(ServiceCategory).map((cat) => (
            <option key={cat} value={cat}>
              {getLabel(ServiceCategoryLabels, cat, language === 'ar' ? 'ar' : 'en')}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.testTypes.basePrice')}
          type="number"
          value={formData.basePrice || ''}
          onChange={(e) => onChange('basePrice', e.target.value)}
          hint="EGP"
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.testTypes.sortOrder')}
          type="number"
          value={formData.sortOrder || 0}
          onChange={(e) => onChange('sortOrder', e.target.value)}
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextareaField
          label={t('adminSettings.testTypes.descriptionEn')}
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          dir="ltr"
        />
        <TextareaField
          label={t('adminSettings.testTypes.descriptionAr')}
          value={formData.descriptionAr || ''}
          onChange={(e) => onChange('descriptionAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <CheckboxField
        label={t('adminSettings.common.isActive')}
        checked={formData.isActive ?? true}
        onChange={(checked) => onChange('isActive', checked)}
      />
    </>
  );
}

function SampleTypeForm({ formData, errors, onChange, isEditMode, testTypes }: FormProps & { testTypes: TestType[] }) {
  const { t } = useTranslation();
  const { language } = useSettings();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.sampleTypes.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.sampleTypes.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.sampleTypes.code')}
          value={formData.code || ''}
          onChange={(e) => onChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          required
          disabled={isEditMode}
          dir="ltr"
        />
        <SelectField
          label={t('adminSettings.sampleTypes.testType')}
          value={formData.testTypeId || ''}
          onChange={(e) => onChange('testTypeId', e.target.value)}
          error={errors.testTypeId}
          required
        >
          <option value="">{t('common.select')}</option>
          {testTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {language === 'ar' ? tt.nameAr : tt.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.sampleTypes.unitEn')}
          value={formData.unit || ''}
          onChange={(e) => onChange('unit', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.sampleTypes.unitAr')}
          value={formData.unitAr || ''}
          onChange={(e) => onChange('unitAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label={t('adminSettings.sampleTypes.minQuantity')}
          type="number"
          value={formData.minQuantity || 1}
          onChange={(e) => onChange('minQuantity', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.sampleTypes.maxQuantity')}
          type="number"
          value={formData.maxQuantity || ''}
          onChange={(e) => onChange('maxQuantity', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.sampleTypes.pricePerUnit')}
          type="number"
          value={formData.pricePerUnit || ''}
          onChange={(e) => onChange('pricePerUnit', e.target.value)}
          hint="EGP"
          dir="ltr"
        />
      </div>
      <CheckboxField
        label={t('adminSettings.common.isActive')}
        checked={formData.isActive ?? true}
        onChange={(checked) => onChange('isActive', checked)}
      />
    </>
  );
}

function StandardForm({ formData, errors, onChange, isEditMode }: FormProps) {
  const { t } = useTranslation();
  const { language } = useSettings();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.standards.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.standards.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.standards.titleEn')}
          value={formData.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          error={errors.title}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.standards.titleAr')}
          value={formData.titleAr || ''}
          onChange={(e) => onChange('titleAr', e.target.value)}
          error={errors.titleAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label={t('adminSettings.standards.code')}
          value={formData.code || ''}
          onChange={(e) => onChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          required
          disabled={isEditMode}
          dir="ltr"
        />
        <SelectField
          label={t('adminSettings.standards.type')}
          value={formData.type || StandardType.EGYPTIAN}
          onChange={(e) => onChange('type', e.target.value)}
        >
          {Object.values(StandardType).map((type) => (
            <option key={type} value={type}>
              {getLabel(StandardTypeLabels, type, language === 'ar' ? 'ar' : 'en')}
            </option>
          ))}
        </SelectField>
        <InputField
          label={t('adminSettings.standards.version')}
          value={formData.version || ''}
          onChange={(e) => onChange('version', e.target.value)}
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.standards.publishedYear')}
          type="number"
          value={formData.publishedYear || ''}
          onChange={(e) => onChange('publishedYear', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.standards.documentUrl')}
          value={formData.documentUrl || ''}
          onChange={(e) => onChange('documentUrl', e.target.value)}
          dir="ltr"
        />
      </div>
      <CheckboxField
        label={t('adminSettings.common.isActive')}
        checked={formData.isActive ?? true}
        onChange={(checked) => onChange('isActive', checked)}
      />
    </>
  );
}

function PriceListForm({ formData, errors, onChange, isEditMode }: FormProps) {
  const { t } = useTranslation();
  const { language } = useSettings();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.priceLists.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.priceLists.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.priceLists.code')}
          value={formData.code || ''}
          onChange={(e) => onChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          required
          disabled={isEditMode}
          dir="ltr"
        />
        <SelectField
          label={t('adminSettings.priceLists.category')}
          value={formData.category || ServiceCategory.LAB_TESTS}
          onChange={(e) => onChange('category', e.target.value)}
        >
          {Object.values(ServiceCategory).map((cat) => (
            <option key={cat} value={cat}>
              {getLabel(ServiceCategoryLabels, cat, language === 'ar' ? 'ar' : 'en')}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.priceLists.validFrom')}
          type="date"
          value={formData.validFrom?.split('T')[0] || ''}
          onChange={(e) => onChange('validFrom', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.priceLists.validTo')}
          type="date"
          value={formData.validTo?.split('T')[0] || ''}
          onChange={(e) => onChange('validTo', e.target.value)}
          dir="ltr"
        />
      </div>
      <div className="flex gap-6">
        <CheckboxField
          label={t('adminSettings.common.isActive')}
          checked={formData.isActive ?? true}
          onChange={(checked) => onChange('isActive', checked)}
        />
        <CheckboxField
          label={t('adminSettings.priceLists.isDefault')}
          checked={formData.isDefault ?? false}
          onChange={(checked) => onChange('isDefault', checked)}
        />
      </div>
    </>
  );
}

function DistanceRateForm({ formData, errors, onChange }: Omit<FormProps, 'isEditMode'>) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.distanceRates.fromKm')}
          type="number"
          value={formData.fromKm ?? ''}
          onChange={(e) => onChange('fromKm', e.target.value)}
          error={errors.fromKm}
          required
          hint="km"
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.distanceRates.toKm')}
          type="number"
          value={formData.toKm ?? ''}
          onChange={(e) => onChange('toKm', e.target.value)}
          error={errors.toKm}
          required
          hint="km"
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.distanceRates.rate')}
          type="number"
          value={formData.rate ?? ''}
          onChange={(e) => onChange('rate', e.target.value)}
          error={errors.rate}
          required
          hint="EGP"
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.distanceRates.ratePerKm')}
          type="number"
          value={formData.ratePerKm ?? ''}
          onChange={(e) => onChange('ratePerKm', e.target.value)}
          hint="EGP/km"
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextareaField
          label={t('adminSettings.distanceRates.descriptionEn')}
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          dir="ltr"
        />
        <TextareaField
          label={t('adminSettings.distanceRates.descriptionAr')}
          value={formData.descriptionAr || ''}
          onChange={(e) => onChange('descriptionAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <CheckboxField
        label={t('adminSettings.common.isActive')}
        checked={formData.isActive ?? true}
        onChange={(checked) => onChange('isActive', checked)}
      />
    </>
  );
}

function MixerTypeForm({ formData, errors, onChange, isEditMode }: FormProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.mixerTypes.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.mixerTypes.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label={t('adminSettings.mixerTypes.code')}
          value={formData.code || ''}
          onChange={(e) => onChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          required
          disabled={isEditMode}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.mixerTypes.capacity')}
          type="number"
          value={formData.capacity || ''}
          onChange={(e) => onChange('capacity', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.mixerTypes.pricePerBatch')}
          type="number"
          value={formData.pricePerBatch || ''}
          onChange={(e) => onChange('pricePerBatch', e.target.value)}
          hint="EGP"
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.mixerTypes.capacityUnitEn')}
          value={formData.capacityUnit || 'm³'}
          onChange={(e) => onChange('capacityUnit', e.target.value)}
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.mixerTypes.capacityUnitAr')}
          value={formData.capacityUnitAr || 'م³'}
          onChange={(e) => onChange('capacityUnitAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextareaField
          label={t('adminSettings.mixerTypes.descriptionEn')}
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          dir="ltr"
        />
        <TextareaField
          label={t('adminSettings.mixerTypes.descriptionAr')}
          value={formData.descriptionAr || ''}
          onChange={(e) => onChange('descriptionAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <CheckboxField
        label={t('adminSettings.common.isActive')}
        checked={formData.isActive ?? true}
        onChange={(checked) => onChange('isActive', checked)}
      />
    </>
  );
}

function LookupCategoryForm({ formData, errors, onChange, isEditMode }: FormProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('adminSettings.lookupCategories.nameEn')}
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
          required
          dir="ltr"
        />
        <InputField
          label={t('adminSettings.lookupCategories.nameAr')}
          value={formData.nameAr || ''}
          onChange={(e) => onChange('nameAr', e.target.value)}
          error={errors.nameAr}
          required
          dir="rtl"
        />
      </div>
      <InputField
        label={t('adminSettings.lookupCategories.code')}
        value={formData.code || ''}
        onChange={(e) => onChange('code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
        error={errors.code}
        required
        disabled={isEditMode}
        dir="ltr"
        hint={t('adminSettings.lookupCategories.codeHint')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextareaField
          label={t('adminSettings.lookupCategories.descriptionEn')}
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          dir="ltr"
        />
        <TextareaField
          label={t('adminSettings.lookupCategories.descriptionAr')}
          value={formData.descriptionAr || ''}
          onChange={(e) => onChange('descriptionAr', e.target.value)}
          dir="rtl"
        />
      </div>
      <div className="flex gap-6">
        <CheckboxField
          label={t('adminSettings.common.isActive')}
          checked={formData.isActive ?? true}
          onChange={(checked) => onChange('isActive', checked)}
        />
        <CheckboxField
          label={t('adminSettings.lookupCategories.isSystem')}
          checked={formData.isSystem ?? false}
          onChange={(checked) => onChange('isSystem', checked)}
          disabled={isEditMode && formData.isSystem}
        />
      </div>
    </>
  );
}

export default AdminSettingsPage;
