export type CommentUserPreview = {
  id: string;
  name: string | null;
  image: string | null;
};

export type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUserPreview | null;
  replyTo: CommentUserPreview | null;
  /** 仅顶层：该线程下已审核的回复总条数（含嵌套回复，扁平计数） */
  totalReplyCount?: number;
  replies: CommentItem[];
};

export type ServerCommentPayload = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentItem["user"];
  replyTo: CommentItem["replyTo"];
  totalReplyCount?: number;
  replies: ServerCommentPayload[];
};

export type CommentAnchorMeta = {
  rootId: string;
  rootIndex: number;
  isTargetRoot: boolean;
  replyFlatIndex: number | null;
  totalRootCount: number;
  totalReplyCount: number;
};
