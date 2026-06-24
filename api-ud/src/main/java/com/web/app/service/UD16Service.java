package com.web.app.service;

import com.web.app.domain.UD16Request;
import java.util.Map;

public interface UD16Service {
    Map<String, Object> processAdChange(UD16Request request);
}
