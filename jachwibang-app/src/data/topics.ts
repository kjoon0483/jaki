export const POST_TOPICS = ['방 자랑', '자취 꿀팁', '질문', '잡담'] as const;
export type PostTopic = (typeof POST_TOPICS)[number];
