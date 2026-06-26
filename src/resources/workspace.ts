import { BaseResource } from './base';
import type {
  Workspace,
  WorkspaceMember,
  WorkspacePreferences,
  UpdateWorkspaceParams,
  UpdateWorkspacePreferencesParams,
  InviteMemberParams,
  UpdateMemberParams,
} from '../types';

export class WorkspaceResource extends BaseResource {
  get(): Promise<Workspace> {
    return this.fetchData<Workspace>('GET', '/v1/workspace');
  }

  update(params: UpdateWorkspaceParams): Promise<Workspace> {
    return this.fetchData<Workspace>('PATCH', '/v1/workspace', { body: params });
  }

  delete(): Promise<void> {
    return this.fetch<void>('DELETE', '/v1/workspace');
  }

  updatePreferences(params: UpdateWorkspacePreferencesParams): Promise<WorkspacePreferences> {
    return this.fetchData<WorkspacePreferences>('PATCH', '/v1/workspace/preferences', {
      body: params,
    });
  }

  inviteMember(params: InviteMemberParams): Promise<WorkspaceMember> {
    return this.fetchData<WorkspaceMember>('POST', '/v1/workspace/members/invite', {
      body: params,
    });
  }

  updateMember(userId: string, params: UpdateMemberParams): Promise<WorkspaceMember> {
    return this.fetchData<WorkspaceMember>('PATCH', `/v1/workspace/members/${userId}`, {
      body: params,
    });
  }

  removeMember(userId: string): Promise<void> {
    return this.fetch<void>('DELETE', `/v1/workspace/members/${userId}`);
  }
}
