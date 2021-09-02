import React, { FC, useState, useMemo } from 'react';

import { IconButton, useStyles } from '@grafana/ui';

import { SourceDescription } from '../AlertRuleTemplate.types';
import { DeleteRuleTemplateModal } from '../DeleteRuleTemplateModal/DeleteRuleTemplateModal';
import { EditAlertRuleTemplateModal } from '../EditAlertRuleTemplateModal/EditAlertRuleTemplateModal';

import { getStyles } from './AlertRuleTemplateActions.styles';
import { AlertRuleTemplateActionsProps } from './AlertRuleTemplateActions.types';

const nonActionableSources = [SourceDescription.BUILT_IN, SourceDescription.USER_FILE, SourceDescription.SAAS];

export const AlertRuleTemplateActions: FC<AlertRuleTemplateActionsProps> = ({ template, getAlertRuleTemplates }) => {
  const styles = useStyles(getStyles);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { source, yaml, name, summary } = template;
  const isActionDisabled = useMemo(() => nonActionableSources.includes(source), [source]);

  return (
    <div className={styles.actionsWrapper}>
      <IconButton
        data-qa="edit-template-button"
        name="pen"
        disabled={isActionDisabled}
        onClick={() => setEditModalVisible(true)}
      />
      <IconButton
        data-qa="delete-template-button"
        name="times"
        disabled={isActionDisabled}
        onClick={() => setDeleteModalVisible(true)}
      />
      <EditAlertRuleTemplateModal
        yaml={yaml}
        name={name}
        summary={summary}
        isVisible={editModalVisible}
        setVisible={setEditModalVisible}
        getAlertRuleTemplates={getAlertRuleTemplates}
      />
      <DeleteRuleTemplateModal
        template={template}
        setVisible={setDeleteModalVisible}
        getAlertRuleTemplates={getAlertRuleTemplates}
        isVisible={deleteModalVisible}
      />
    </div>
  );
};
