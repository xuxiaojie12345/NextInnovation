package com.web.app.dto;

import lombok.Data;
import java.util.List;

/** UD14: 画面初期表示响应（合并市场列表和文件列表） */
@Data
public class InitPageResponse {
    private List<MarketListResponse> marketList;
    private List<FileInfoResponse> allFiles;
}
