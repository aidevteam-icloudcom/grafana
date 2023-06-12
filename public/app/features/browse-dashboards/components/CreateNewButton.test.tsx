import { render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TestProvider } from 'test/helpers/TestProvider';

import { FolderDTO } from 'app/types';

import CreateNewButton from './CreateNewButton';

const mockParentFolder: FolderDTO = {
  canAdmin: true,
  canDelete: true,
  canEdit: true,
  canSave: true,
  created: '',
  createdBy: '',
  hasAcl: true,
  id: 1,
  title: 'myFolder',
  uid: '12345',
  updated: '',
  updatedBy: '',
  url: '',
  version: 1,
};

function render(...[ui, options]: Parameters<typeof rtlRender>) {
  rtlRender(<TestProvider>{ui}</TestProvider>, options);
}

async function renderAndOpen(folder?: FolderDTO) {
  render(<CreateNewButton canCreateDashboard canCreateFolder parentFolder={folder} />);
  const newButton = screen.getByText('New');
  await userEvent.click(newButton);
}

describe('NewActionsButton', () => {
  it('should display the correct urls with a given parent folder', async () => {
    await renderAndOpen(mockParentFolder);

    expect(screen.getByText('New dashboard')).toHaveAttribute(
      'href',
      `/dashboard/new?folderUid=${mockParentFolder.uid}`
    );
    expect(screen.getByText('Import')).toHaveAttribute('href', `/dashboard/import?folderUid=${mockParentFolder.uid}`);
  });

  it('should display urls without params when there is no parent folder', async () => {
    await renderAndOpen();

    expect(screen.getByText('New dashboard')).toHaveAttribute('href', '/dashboard/new');
    expect(screen.getByText('Import')).toHaveAttribute('href', '/dashboard/import');
  });

  it('clicking the "New folder" button opens the drawer', async () => {
    render(<CreateNewButton canCreateDashboard canCreateFolder parentFolder={mockParentFolder} />);

    const newButton = screen.getByText('New');
    await userEvent.click(newButton);
    await userEvent.click(screen.getByText('New folder'));

    const drawer = screen.getByRole('dialog', { name: 'Drawer title New folder' });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByRole('heading', { name: 'New folder' })).toBeInTheDocument();
    expect(within(drawer).getByText(`Location: ${mockParentFolder.title}`)).toBeInTheDocument();
  });

  it('should only render dashboard items when folder creation is disabled', async () => {
    render(<CreateNewButton canCreateDashboard canCreateFolder={false} />);
    const newButton = screen.getByText('New');
    await userEvent.click(newButton);

    expect(screen.getByText('New dashboard')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.queryByText('New folder')).not.toBeInTheDocument();
  });

  it('should only render folder item when dashboard creation is disabled', async () => {
    render(<CreateNewButton canCreateDashboard={false} canCreateFolder />);
    const newButton = screen.getByText('New');
    await userEvent.click(newButton);

    expect(screen.queryByText('New dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
    expect(screen.getByText('New folder')).toBeInTheDocument();
  });
});
