package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD14MarketListResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<MarketItem> markets;
    }

    @Data
    public static class MarketItem {
        private String market;
    }

    public static UD14MarketListResponse success(List<MarketItem> markets) {
        UD14MarketListResponse res = new UD14MarketListResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        DataInfo d = new DataInfo();
        d.setMarkets(markets);
        res.setData(d);
        return res;
    }
}
