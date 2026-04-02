package com.lin.aimultagent.dto.response;

/**
 * 完美匹配 AiConstants 中定义的“多智能体总管家”返回格式
 */
public record GameResponse(AiData aiData) {

    public record AiData(
            String master_thought,     // 总管家思考过程
            String active_speaker,     // 当前发言人 (Ling/Rou/Zhi)
            String speaker_reply,      // 发言人回复内容
            String speaker_emotion,    // 情绪状态
            AffectionChanges affection_changes, // 独立好感度变化
            String system_event        // 系统事件
    ) {}

    public record AffectionChanges(
            int ling,
            int rou,
            int zhi
    ) {}
}