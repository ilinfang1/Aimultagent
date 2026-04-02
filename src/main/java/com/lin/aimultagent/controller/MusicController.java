package com.lin.aimultagent.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/music")
@CrossOrigin(origins = "*")
public class MusicController {

    // 这里你自己填
    private static final String API_KEY = "Shanhai-VB5fi2kalotIyCqe5NHcZJA5MNMaVTacX6EIcbuNoalDcvX0";

    private static final String KUWO_URL = "https://apione.apibyte.cn/kwmusic";
    private static final String MIGU_URL = "https://apione.apibyte.cn/mgmusic";
    private static final String FIVESING_URL = "https://apione.apibyte.cn/5sing";
    private static final String SODA_URL = "https://apione.apibyte.cn/sodamusicparse";
    private static final String SINGDUCK_URL = "https://apione.apibyte.cn/singduck";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/search")
    public ResponseEntity<String> search(
            @RequestParam String source,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "12") int size
    ) throws Exception {
        String body;

        switch (source) {
            case "kuwo" -> body = doGetText(KUWO_URL
                    + "?action=search"
                    + "&keyword=" + encode(keyword)
                    + "&type=music"
                    + "&page=0"
                    + "&size=" + size
                    + "&key=" + encode(API_KEY));

            case "migu" -> body = doGetText(MIGU_URL
                    + "?msg=" + encode(keyword)
                    + "&num=" + size
                    + "&type=2"
                    + "&key=" + encode(API_KEY));

            case "5sing" -> body = doGetText(FIVESING_URL
                    + "?msg=" + encode(keyword)
                    + "&type=json"
                    + "&key=" + encode(API_KEY));

            case "soda" -> body = doGetText(SODA_URL
                    + "?url=" + encode(keyword)
                    + "&key=" + encode(API_KEY));

            case "singduck" -> body = doGetText(SINGDUCK_URL
                    + "?key=" + encode(API_KEY));

            default -> throw new RuntimeException("不支持的歌曲源: " + source);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @GetMapping("/detail")
    public ResponseEntity<Map<String, Object>> detail(
            @RequestParam String source,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String musicId,
            @RequestParam(required = false, defaultValue = "") String index,
            @RequestParam(required = false, defaultValue = "p") String quality
    ) throws Exception {
        Map<String, Object> data = new HashMap<>();

        switch (source) {
            case "kuwo" -> {
                if (musicId == null || musicId.isBlank()) {
                    throw new RuntimeException("酷我歌曲缺少 musicId，请检查前端是否传入 rid");
                }

                String infoBody = doGetText(KUWO_URL
                        + "?action=music_info"
                        + "&music_id=" + encode(musicId)
                        + "&key=" + encode(API_KEY));

                String lyricBody = doGetText(KUWO_URL
                        + "?action=lyric"
                        + "&music_id=" + encode(musicId)
                        + "&key=" + encode(API_KEY));

                JsonNode infoRoot = readJsonSafely(infoBody, "酷我 music_info");

                JsonNode lyricRoot;
                try {
                    lyricRoot = readJsonSafely(lyricBody, "酷我 lyric");
                } catch (Exception e) {
                    lyricRoot = objectMapper.readTree("{\"code\":200,\"msg\":\"success\",\"data\":null}");
                }

                JsonNode infoData = infoRoot.path("data");
                String lyric = extractLyricText(lyricRoot);

                data.put("title", infoData.path("name").asText(""));
                data.put("artist", infoData.path("artist").asText(""));
                data.put("cover", infoData.path("pic").asText(""));
                data.put("lyric", lyric);
                data.put("url", "http://localhost:8080/api/music/stream?source=kuwo&musicId="
                        + encode(musicId)
                        + "&quality="
                        + encode(quality));
            }

            case "migu" -> {
                String detailBody = doGetText(MIGU_URL
                        + "?msg=" + encode(keyword)
                        + "&n=" + encode(index)
                        + "&br=1"
                        + "&type=1"
                        + "&key=" + encode(API_KEY));

                JsonNode root = readJsonSafely(detailBody, "咪咕 detail");

                data.put("title", root.path("title").asText(""));
                data.put("artist", root.path("singer").asText(""));
                data.put("cover", root.path("cover").asText(""));
                data.put("lyric", root.path("lyric").asText(""));
                data.put("url", "http://localhost:8080/api/music/stream?source=migu&keyword="
                        + encode(keyword)
                        + "&index="
                        + encode(index));
            }

            case "5sing" -> {
                String detailBody = doGetText(FIVESING_URL
                        + "?msg=" + encode(keyword)
                        + "&n=" + encode(index)
                        + "&type=json"
                        + "&key=" + encode(API_KEY));

                JsonNode root = readJsonSafely(detailBody, "5sing detail");

                data.put("title", root.path("title").asText(""));
                data.put("artist", root.path("singer").asText(""));
                data.put("cover", root.path("cover").asText(""));
                data.put("lyric", "");
                data.put("url", "http://localhost:8080/api/music/stream?source=5sing&keyword="
                        + encode(keyword)
                        + "&index="
                        + encode(index));
            }

            default -> throw new RuntimeException("当前歌曲源无需 detail 或不支持: " + source);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", data);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stream")
    public void stream(
            @RequestParam String source,
            @RequestParam(required = false, defaultValue = "") String musicId,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String index,
            @RequestParam(required = false, defaultValue = "p") String quality,
            HttpServletResponse response,
            @RequestHeader(value = "Range", required = false) String range
    ) throws Exception {
        String realAudioUrl;

        switch (source) {
            case "kuwo" -> {
                if (musicId == null || musicId.isBlank()) {
                    throw new RuntimeException("酷我音频流缺少 musicId");
                }

                String urlBody = doGetText(KUWO_URL
                        + "?action=music_url"
                        + "&music_id=" + encode(musicId)
                        + "&quality=" + encode(quality)
                        + "&key=" + encode(API_KEY));

                JsonNode root = readJsonSafely(urlBody, "酷我 music_url");
                realAudioUrl = root.path("data").path("url").asText("");
            }

            case "migu" -> {
                String detailBody = doGetText(MIGU_URL
                        + "?msg=" + encode(keyword)
                        + "&n=" + encode(index)
                        + "&br=1"
                        + "&type=1"
                        + "&key=" + encode(API_KEY));

                JsonNode root = readJsonSafely(detailBody, "咪咕 stream detail");
                realAudioUrl = root.path("music_url").asText("");
            }

            case "5sing" -> {
                String detailBody = doGetText(FIVESING_URL
                        + "?msg=" + encode(keyword)
                        + "&n=" + encode(index)
                        + "&type=json"
                        + "&key=" + encode(API_KEY));

                JsonNode root = readJsonSafely(detailBody, "5sing stream detail");
                realAudioUrl = root.path("url").asText("");
            }

            default -> throw new RuntimeException("不支持的音频流来源: " + source);
        }

        proxyAudio(realAudioUrl, response, range);
    }

    @GetMapping("/stream/direct")
    public void streamDirect(
            @RequestParam String url,
            HttpServletResponse response,
            @RequestHeader(value = "Range", required = false) String range
    ) throws Exception {
        proxyAudio(url, response, range);
    }

    private void proxyAudio(String realAudioUrl, HttpServletResponse response, String range) throws Exception {
        if (realAudioUrl == null || realAudioUrl.isBlank()) {
            response.setStatus(404);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"msg\":\"未获取到可播放音频地址\",\"code\":404}");
            return;
        }

        HttpURLConnection conn = (HttpURLConnection) URI.create(realAudioUrl).toURL().openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");

        if (range != null && !range.isBlank()) {
            conn.setRequestProperty("Range", range);
        }

        int statusCode = conn.getResponseCode();

        String contentType = conn.getContentType();
        String contentLength = conn.getHeaderField("Content-Length");
        String contentRange = conn.getHeaderField("Content-Range");
        String acceptRanges = conn.getHeaderField("Accept-Ranges");

        response.setStatus(statusCode);
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType(contentType != null ? contentType : "audio/mpeg");

        if (contentLength != null) {
            response.setHeader("Content-Length", contentLength);
        }
        if (contentRange != null) {
            response.setHeader("Content-Range", contentRange);
        }
        response.setHeader("Accept-Ranges", acceptRanges != null ? acceptRanges : "bytes");

        try (InputStream inputStream = conn.getInputStream()) {
            StreamUtils.copy(inputStream, response.getOutputStream());
            response.flushBuffer();
        }
    }

    private String extractLyricText(JsonNode root) {
        if (root == null || root.isNull()) return "";

        JsonNode data = root.path("data");
        if (data.isTextual()) return data.asText("");
        if (data.path("lyric").isTextual()) return data.path("lyric").asText("");
        if (data.path("lrc").isTextual()) return data.path("lrc").asText("");
        if (root.path("lyric").isTextual()) return root.path("lyric").asText("");
        if (root.path("lrc").isTextual()) return root.path("lrc").asText("");

        if (data.path("lrclist").isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode item : data.path("lrclist")) {
                String time = item.path("time").asText("00:00.00");
                String text = "";
                if (item.path("lineLyric").isTextual()) {
                    text = item.path("lineLyric").asText("");
                } else if (item.path("lyric").isTextual()) {
                    text = item.path("lyric").asText("");
                } else if (item.path("text").isTextual()) {
                    text = item.path("text").asText("");
                }
                sb.append("[").append(time).append("]").append(text).append("\n");
            }
            return sb.toString().trim();
        }

        return "";
    }

    private JsonNode readJsonSafely(String body, String scene) throws Exception {
        if (body == null || body.isBlank()) {
            throw new RuntimeException(scene + " 返回空响应");
        }

        String trimmed = body.trim();

        if (trimmed.startsWith("<")) {
            throw new RuntimeException(scene + " 返回了 HTML，不是 JSON：\n" + body);
        }

        return objectMapper.readTree(trimmed);
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
            throw new RuntimeException("请求失败，且无响应体，HTTP状态码: " + code);
        }

        String body = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);

        if (code < 200 || code >= 300) {
            throw new RuntimeException("请求失败: HTTP " + code + "，响应：" + body);
        }

        if (body == null || body.isBlank()) {
            throw new RuntimeException("第三方返回空响应");
        }

        return body;
    }

    private String encode(String text) {
        return URLEncoder.encode(text == null ? "" : text, StandardCharsets.UTF_8);
    }
}