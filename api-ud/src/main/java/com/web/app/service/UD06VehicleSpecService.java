package com.web.app.service;

import com.web.app.dto.UD06ModificationDetailRequest;
import com.web.app.dto.UD06ModificationDetailResponse;

public interface UD06VehicleSpecService {
    UD06ModificationDetailResponse selectModificationDetails(UD06ModificationDetailRequest request);
}
