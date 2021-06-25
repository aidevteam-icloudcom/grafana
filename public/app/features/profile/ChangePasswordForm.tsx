import React, { FC } from 'react';
import { css } from '@emotion/css';
import { Button, Field, Form, HorizontalGroup, LinkButton } from '@grafana/ui';

import config from 'app/core/config';
import { UserDTO } from 'app/types';
import { ChangePasswordFields } from './types';
import { PasswordField } from '../../core/components/PasswordField';

export interface Props {
  user: UserDTO;
  isSaving: boolean;
  onChangePassword: (payload: ChangePasswordFields) => void;
}

export const ChangePasswordForm: FC<Props> = ({ user, onChangePassword, isSaving }) => {
  const { ldapEnabled, authProxyEnabled, disableLoginForm } = config;
  const authSource = user.authLabels?.length && user.authLabels[0];

  if (ldapEnabled || authProxyEnabled) {
    return <p>You cannot change password when LDAP or auth proxy authentication is enabled.</p>;
  }
  if (authSource && disableLoginForm) {
    return <p>Password cannot be changed here.</p>;
  }

  return (
    <div
      className={css`
        max-width: 400px;
      `}
    >
      <Form onSubmit={onChangePassword}>
        {({ register, errors, getValues }) => {
          return (
            <>
              <Field label="Old password" invalid={!!errors.oldPassword} error={errors?.oldPassword?.message}>
                {/* <Input type="password" {...register('oldPassword', { required: 'Old password is required' })} /> */}
                <PasswordField
                  id="current-password"
                  autoComplete="current-password"
                  register={register('oldPassword', { required: 'Old password is required' }) as any}
                />
              </Field>

              <Field label="New password" invalid={!!errors.newPassword} error={errors?.newPassword?.message}>
                <PasswordField
                  id="new-password"
                  autoComplete="new-password"
                  register={
                    register('newPassword', {
                      required: 'New password is required',
                      validate: {
                        confirm: (v) => v === getValues().confirmNew || 'Passwords must match',
                        old: (v) => v !== getValues().oldPassword || `New password can't be the same as the old one.`,
                      },
                    }) as any
                  }
                />
              </Field>

              <Field label="Confirm password" invalid={!!errors.confirmNew} error={errors?.confirmNew?.message}>
                <PasswordField
                  id="new-password"
                  autoComplete="new-password"
                  register={
                    register('confirmNew', {
                      required: 'New password confirmation is required',
                      validate: (v) => v === getValues().newPassword || 'Passwords must match',
                    }) as any
                  }
                />
              </Field>
              <HorizontalGroup>
                <Button variant="primary" disabled={isSaving}>
                  Change Password
                </Button>
                <LinkButton variant="secondary" href={`${config.appSubUrl}/profile`} fill="outline">
                  Cancel
                </LinkButton>
              </HorizontalGroup>
            </>
          );
        }}
      </Form>
    </div>
  );
};
