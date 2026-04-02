package com.lin.aimultagent.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lin.aimultagent.common.constant.AiConstants;
import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.ChatRequest;
import com.lin.aimultagent.dto.response.GameResponse;
import com.lin.aimultagent.entity.PlayerSave;
import com.lin.aimultagent.repository.PlayerSaveRepository;
import com.lin.aimultagent.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameServiceImpl implements GameService {

    @Autowired
    private PlayerSaveRepository saveRepository;

    private static final String GEMINI_API_KEY = "AIzaSyCkyRa5ntLeOxUiDih0fMcvnmsuB6xojQY";

    @Override
    public GameResponse processPlayerTurn(ChatRequest request) {
        try {
            String userMessage = request.message();
            String imageBase64 = request.imageBase64();
            ObjectMapper mapper = new ObjectMapper();

            String finalPrompt = AiConstants.MULTI_AGENT_SYSTEM_PROMPT + "\n\n【玩家当前输入】：" + userMessage;

            // 构造多模态 (文本 + 图片) 请求体
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", finalPrompt);
            parts.add(textPart);

            if (imageBase64 != null && !imageBase64.trim().isEmpty()) {
                try {
                    String[] base64Array = imageBase64.split(",");
                    String mimeType = base64Array[0].substring(5, base64Array[0].indexOf(";"));
                    String rawBase64 = base64Array[1];

                    Map<String, Object> imagePart = new HashMap<>();
                    Map<String, Object> inlineData = new HashMap<>();
                    inlineData.put("mimeType", mimeType);
                    inlineData.put("data", rawBase64);
                    imagePart.put("inlineData", inlineData);
                    parts.add(imagePart);
                } catch (Exception e) {
                    System.err.println("⚠️ 图片Base64解析失败，降级为纯文本请求");
                }
            }

            content.put("parts", parts);
            requestBody.put("contents", Collections.singletonList(content));

            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress("127.0.0.1", 7897));
            requestFactory.setProxy(proxy);
            // 给图片上传更宽容的超时时间
            requestFactory.setConnectTimeout(15000);
            requestFactory.setReadTimeout(30000);

            RestTemplate restTemplate = new RestTemplate(requestFactory);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(requestBody), headers);

            String targetUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;

            String responseStr = restTemplate.postForObject(targetUrl, entity, String.class);

            JsonNode root = mapper.readTree(responseStr);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            String cleanJson = rawText.replaceAll("^```json|```$", "").trim();
            GameResponse.AiData aiData = mapper.readValue(cleanJson, GameResponse.AiData.class);

            System.out.println("🤖 [总管家决策]: " + aiData.master_thought());
            return new GameResponse(aiData);

        } catch (Exception e) {
            // ==========================================
            // 🛡️ 架构师级：智能异常捕获与优雅降级保护网
            // ==========================================
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            System.err.println("❌ AI 链路故障: " + errorMsg);

            String fallbackReply;
            String emotion = "concerned";

            // 1. Google 算力过载 / 免费接口被限流 (503 / 429)
            if (errorMsg.contains("503") || errorMsg.contains("high demand") || errorMsg.contains("429")) {
                fallbackReply = "（系统提示：主宰，Google 算力节点当前被全球开发者挤爆啦！学姐的视觉神经正在排队，请您喝口水，过一两分钟后再试哦～☕）";
                emotion = "thinking";
            }
            // 2. 跨洋网络超时 / 代理断开
            else if (errorMsg.contains("Timeout") || errorMsg.contains("timed out") || errorMsg.contains("Connection refused")) {
                fallbackReply = "（系统提示：跨洋神经链路连接超时啦！主宰，请检查一下您的 Clash 代理软件是否正常运行哦～📡）";
            }
            // 3. 其他未知异常（如模型返回格式错乱）
            else {
                fallbackReply = "（系统提示：神经链路受到未知时空波动干扰，脑机接口解析失败，请重试一次～🌀）";
            }

            // 无论发生什么致命错误，永远返回一个格式完好的 JSON 给前端，确保前端绝不白屏崩溃
            GameResponse.AffectionChanges defaultChanges = new GameResponse.AffectionChanges(0, 0, 0);
            return new GameResponse(new GameResponse.AiData(
                    "触发全局异常降级保护", "Rou", fallbackReply,
                    emotion, defaultChanges, ""
            ));
        }
    }

    @Override
    public Result loadGame(Integer userId) { return saveRepository.findById(userId).map(Result::success).orElse(Result.error("存档失踪")); }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result saveGame(PlayerSave incomingSave) { if (incomingSave.getId() == null) return Result.error("权限不足"); saveRepository.save(incomingSave); return Result.success("同步成功"); }
}