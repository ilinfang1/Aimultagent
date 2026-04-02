package com.lin.aimultagent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.ChatRequest;
import com.lin.aimultagent.dto.response.GameResponse;
import com.lin.aimultagent.entity.CloudArchive;
import com.lin.aimultagent.repository.CloudArchiveRepository;
import com.lin.aimultagent.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private CloudArchiveRepository cloudArchiveRepository;

    @Autowired
    private ObjectMapper objectMapper; // Spring Boot 内置的 JSON 处理神器

    // ==========================================
    // 1. AI 聊天接口 (完全保留你的核心业务)
    // ==========================================
    @PostMapping("/chat")
    public Result<GameResponse> chat(@RequestBody ChatRequest request) {
        try {
            // 交给 Service 层去调用大模型
            GameResponse response = gameService.processPlayerTurn(request);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("游戏引擎异常: " + e.getMessage());
        }
    }

    // ==========================================
    // 2. 读取全量云端存档接口 (JPA 升级版)
    // ==========================================
    @GetMapping("/load")
    public Result<Map<String, Object>> loadGame(@RequestParam Long userId) throws Exception {
        Optional<CloudArchive> optionalArchive = cloudArchiveRepository.findById(userId);

        // 如果是新用户（数据库里没记录），返回基础默认值
        if (optionalArchive.isEmpty()) {
            Map<String, Object> defaultData = new HashMap<>();
            defaultData.put("focusCrystals", 0);
            defaultData.put("baseLevel", 1);
            return Result.success(defaultData);
        }

        CloudArchive archive = optionalArchive.get();
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("focusCrystals", archive.getFocusCrystals());
        responseData.put("baseLevel", archive.getBaseLevel());

        // 将数据库中的 JSON 字符串还原为对象或数组发给前端
        if (archive.getStatsJson() != null) {
            responseData.put("stats", objectMapper.readValue(archive.getStatsJson(), Map.class));
        }
        if (archive.getBadgesJson() != null) {
            responseData.put("badges", objectMapper.readValue(archive.getBadgesJson(), List.class));
        }
        if (archive.getQuestsJson() != null) {
            responseData.put("quests", objectMapper.readValue(archive.getQuestsJson(), List.class));
        }

        return Result.success(responseData);
    }

    // ==========================================
    // 3. 保存全量云端存档接口 (JPA 升级版)
    // ==========================================
    @PostMapping("/save")
    public Result<String> saveGame(@RequestBody Map<String, Object> payload) throws Exception {
        Long userId = Long.valueOf(payload.get("id").toString());
        Integer crystals = Integer.parseInt(payload.get("focusCrystals").toString());
        Integer level = Integer.parseInt(payload.get("baseLevel").toString());

        // 将复杂对象转为 JSON 字符串
        String statsJson = objectMapper.writeValueAsString(payload.get("stats"));
        String badgesJson = objectMapper.writeValueAsString(payload.get("badges"));
        String questsJson = objectMapper.writeValueAsString(payload.get("quests"));

        // JPA 风格的查询与保存
        CloudArchive archive = cloudArchiveRepository.findById(userId).orElse(new CloudArchive());
        archive.setUserId(userId);
        archive.setFocusCrystals(crystals);
        archive.setBaseLevel(level);
        archive.setStatsJson(statsJson);
        archive.setBadgesJson(badgesJson);
        archive.setQuestsJson(questsJson);

        // save 方法会自动判断：如果 ID 存在就 update，不存在就 insert
        cloudArchiveRepository.save(archive);

        return Result.success("云端同步完成");
    }
}