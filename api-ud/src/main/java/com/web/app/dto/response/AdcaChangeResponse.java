package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdcaChangeResponse {
    private String serie;
    private String chnr;
    private String act;
}
