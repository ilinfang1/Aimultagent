package com.lin.aimultagent.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/boxoffice")
@CrossOrigin(origins = "*")
public class BoxOfficeController {

    // 这里你自己填
    private static final String API_KEY = "api.key";

    private static final String BOX_OFFICE_URL = "https://apione.apibyte.cn/boxoffice";

    @GetMapping("/realtime")
    public ResponseEntity<String> getRealtimeBoxOffice() throws Exception {
        String url = BOX_OFFICE_URL + "?key=" + API_KEY;
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
            throw new RuntimeException("票房接口请求失败，且无响应体，HTTP状态码: " + code);
        }

        String body = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);

        if (code < 200 || code >= 300) {
            throw new RuntimeException("票房接口请求失败: HTTP " + code + "，响应：" + body);
        }

        if (body == null || body.isBlank()) {
            throw new RuntimeException("票房接口返回空响应");
        }

        return body;
    }
}
