import { getBackendSrv } from '@grafana/runtime';
import { updateNavIndex } from 'app/core/actions';
import { contextSrv } from 'app/core/core';
import { accessControlQueryParam } from 'app/core/utils/accessControl';
import { AccessControlAction, TeamMember, ThunkResult } from 'app/types';

import { buildNavModel } from './navModel';
import { teamGroupsLoaded, teamLoaded, teamMembersLoaded, teamsLoaded } from './reducers';

export function loadTeams(): ThunkResult<void> {
  return async (dispatch) => {
    // Early return if the user cannot list teams
    if (!contextSrv.hasPermission(AccessControlAction.ActionTeamsRead)) {
      dispatch(teamsLoaded([]));
      return;
    }

    const response = await getBackendSrv().get(
      '/api/teams/search',
      accessControlQueryParam({ perpage: 1000, page: 1 })
    );
    dispatch(teamsLoaded(response.teams));
  };
}

export function loadTeam(id: number): ThunkResult<void> {
  return async (dispatch) => {
    const response = await getBackendSrv().get(`/api/teams/${id}`, accessControlQueryParam());
    dispatch(teamLoaded(response));
    dispatch(updateNavIndex(buildNavModel(response)));
  };
}

export function loadTeamMembers(): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    const response = await getBackendSrv().get(`/api/teams/${team.id}/members`);
    dispatch(teamMembersLoaded(response));
  };
}

export function addTeamMember(id: number): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    await getBackendSrv().post(`/api/teams/${team.id}/members`, { userId: id });
    dispatch(loadTeamMembers());
  };
}

export function removeTeamMember(id: number): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    await getBackendSrv().delete(`/api/teams/${team.id}/members/${id}`);
    dispatch(loadTeamMembers());
  };
}

export function updateTeam(name: string, email: string): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    await getBackendSrv().put(`/api/teams/${team.id}`, { name, email });
    dispatch(loadTeam(team.id));
  };
}

export function loadTeamGroups(): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    const response = await getBackendSrv().get(`/api/teams/${team.id}/groups`);
    dispatch(teamGroupsLoaded(response));
  };
}

export function addTeamGroup(groupId: string, groupDesc: string): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    await getBackendSrv().post(`/api/teams/${team.id}/groups`, { groupId: groupId, description: groupDesc });
    dispatch(loadTeamGroups());
  };
}

export function removeTeamGroup(groupId: string): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const team = getStore().team.team;
    await getBackendSrv().delete(`/api/teams/${team.id}/groups/${encodeURIComponent(groupId)}`);
    dispatch(loadTeamGroups());
  };
}

export function deleteTeam(id: number): ThunkResult<void> {
  return async (dispatch) => {
    await getBackendSrv().delete(`/api/teams/${id}`);
    // Update users permissions in case they lost teams.read with the deletion
    await contextSrv.fetchUserPermissions();
    dispatch(loadTeams());
  };
}

export function updateTeamMember(member: TeamMember): ThunkResult<void> {
  return async (dispatch) => {
    await getBackendSrv().put(`/api/teams/${member.teamId}/members/${member.userId}`, {
      permission: member.permission,
    });
    dispatch(loadTeamMembers());
  };
}
