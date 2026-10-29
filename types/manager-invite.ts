export type ManagerInviteResult = {
  requested: true;
  sent: boolean;
  email: string;
  notice: string;
};

export type InviteManagerResponse = {
  managerInvite: ManagerInviteResult;
};

export type AcceptInviteResponse = {
  membership: {
    id: string;
    role: "MANAGER";
  };
  organization: {
    id: string;
    name: string;
  };
};
