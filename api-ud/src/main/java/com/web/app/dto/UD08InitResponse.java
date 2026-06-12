package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD08InitResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<UD08ProductClassMasterResponse.ProductClassItem> productClasses;
        private List<UD08MarketMasterResponse.MarketItem> markets;
    }

    public static UD08InitResponse success(List<UD08ProductClassMasterResponse.ProductClassItem> pcs, List<UD08MarketMasterResponse.MarketItem> markets) {
        UD08InitResponse res = new UD08InitResponse();
        res.setCode(200);
        res.setMsg("Success");
        DataInfo d = new DataInfo();
        d.setProductClasses(pcs);
        d.setMarkets(markets);
        res.setData(d);
        return res;
    }
}
