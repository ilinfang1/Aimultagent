package com.lin.aimultagent.service;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.ChatRequest;
import com.lin.aimultagent.dto.response.GameResponse;
import com.lin.aimultagent.entity.PlayerSave;

public interface GameService {

    // 处理玩家的回合 (调用大模型聊天)
    GameResponse processPlayerTurn(ChatRequest request);

    // 读取玩家存档
    Result loadGame(Integer userId);

    // 保存玩家存档
    Result saveGame(PlayerSave incomingSave);
}