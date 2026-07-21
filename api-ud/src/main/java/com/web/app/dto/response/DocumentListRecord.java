package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentListRecord {
    private String doctype;
    private String businessUnit;
    private String user;
    private String date;
}
