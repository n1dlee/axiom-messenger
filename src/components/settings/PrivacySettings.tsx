import { useState } from 'react';
import { useTdlib } from '../../hooks/useTdlib';
import styles from './Settings.module.css';

type Rule = 'userPrivacySettingAllowAll' | 'userPrivacySettingAllowContacts' | 'userPrivacySettingAllowNobody';

interface PrivacyItem {
  id: string;
  label: string;
  description: string;
}

const PRIVACY_ITEMS: PrivacyItem[] = [
  { id: 'userPrivacySettingShowStatus',             label: 'Время активности',    description: 'Кто видит когда вы в сети' },
  { id: 'userPrivacySettingAllowChatInvites',       label: 'Добавление в группы', description: 'Кто может добавлять вас в группы' },
  { id: 'userPrivacySettingAllowCalls',             label: 'Звонки',              description: 'Кто может звонить вам' },
  { id: 'userPrivacySettingSharePhoneNumber',       label: 'Номер телефона',       description: 'Кто видит ваш номер' },
  { id: 'userPrivacySettingShowProfilePhoto',       label: 'Фото профиля',         description: 'Кто видит вашу аватарку' },
  { id: 'userPrivacySettingAllowFindingByPhoneNumber', label: 'Поиск по номеру', description: 'Кто может найти вас по номеру' },
];

const RULE_LABELS: Record<Rule, string> = {
  userPrivacySettingAllowAll:      'Все',
  userPrivacySettingAllowContacts: 'Мои контакты',
  userPrivacySettingAllowNobody:   'Никто',
};

export function PrivacySettings() {
  const tdlib = useTdlib();
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [saved, setSaved] = useState<string | null>(null);

  async function handleChange(setting: string, rule: Rule) {
    setRules(prev => ({ ...prev, [setting]: rule }));
    await tdlib.setPrivacyRules(setting, {
      '@type': 'userPrivacySettingRules',
      rules: [{ '@type': rule }],
    });
    setSaved(setting);
    setTimeout(() => setSaved(null), 1500);
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Приватность</h3>
      <p className={styles.sectionDesc}>Управляйте тем, кто может видеть вашу информацию и связываться с вами.</p>

      <div className={styles.list}>
        {PRIVACY_ITEMS.map(item => (
          <div key={item.id} className={styles.listItem}>
            <div className={styles.listItemInfo}>
              <span className={styles.listItemLabel}>{item.label}</span>
              <span className={styles.listItemDesc}>{item.description}</span>
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={rules[item.id] ?? 'userPrivacySettingAllowAll'}
                onChange={e => handleChange(item.id, e.target.value as Rule)}
              >
                {Object.entries(RULE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {saved === item.id && <span className={styles.savedMark}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
