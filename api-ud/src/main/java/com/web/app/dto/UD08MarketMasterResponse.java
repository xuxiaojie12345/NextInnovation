package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD08MarketMasterResponse {
    private int code;
    private String msg;
    private List<MarketItem> data;

    @Data
    public static class MarketItem {
        private String market;
    }
}
