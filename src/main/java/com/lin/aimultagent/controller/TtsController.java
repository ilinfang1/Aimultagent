package com.lin.aimultagent.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/tts")
@CrossOrigin(origins = "*")
public class TtsController {

    // 这里填你自己的山海云端 key
    private static final String API_KEY = "api.key";

    private static final String TTS_URL = "https://apione.apibyte.cn/tts";

    @GetMapping("/speak")
    public ResponseEntity<String> speak(
            @RequestParam String text,
            @RequestParam(defaultValue = "female_zhubo") String voiceType
    ) throws Exception {

        String url = TTS_URL
                + "?key=" + encode(API_KEY)
                + "&text=" + encode(text)
                + "&voice_type=" + encode(voiceType);

        String body = doGetText(url);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    private String doGetText(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("X-Api-Key", API_KEY);

        int code = conn.getResponseCode();
        InputStream inputStream = (code >= 200 && code < 300)
                ? conn.getInputStream()
                : conn.getErrorStream();

        if (inputStream == null) {
            throw new RuntimeException("TTS 请求失败，且无响应体，HTTP状态码: " + code);
        }

        String body = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);

        if (code < 200 || code >= 300) {
            throw new RuntimeException("TTS 请求失败: HTTP " + code + "，响应：" + body);
        }

        if (body == null || body.isBlank()) {
            throw new RuntimeException("TTS 返回空响应");
        }

        return body;
    }

    private String encode(String text) {
        return URLEncoder.encode(text == null ? "" : text, StandardCharsets.UTF_8);
    }
}
