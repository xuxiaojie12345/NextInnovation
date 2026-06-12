package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD08ProductClassMasterResponse {
    private int code;
    private String msg;
    private List<ProductClassItem> data;

    @Data
    public static class ProductClassItem {
        private String pc;
    }
}
