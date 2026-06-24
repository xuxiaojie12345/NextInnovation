package com.web.app.service;

import com.web.app.domain.UD18Request;
import java.util.Map;

public interface UD18Service {
    Map<String, Object> processUserDoc(UD18Request request);
}
