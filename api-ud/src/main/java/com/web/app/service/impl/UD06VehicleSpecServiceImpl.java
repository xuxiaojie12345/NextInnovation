package com.web.app.service.impl;

import com.web.app.service.UD06VehicleSpecService;
import com.web.app.dto.UD06ModificationDetailRequest;
import com.web.app.dto.UD06ModificationDetailResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.entity.HdocAdcaModification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD06VehicleSpecServiceImpl implements UD06VehicleSpecService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public UD06ModificationDetailResponse selectModificationDetails(UD06ModificationDetailRequest request) {
        if (request == null || request.getChassisNo() == null) {
            return UD06ModificationDetailResponse.error("Invalid request parameters");
        }

        List<HdocAdcaModification> mods = hdocAdcaModificationMapper.selectBySerieAndChno("", request.getChassisNo());
        if (mods == null || mods.isEmpty()) {
            return UD06ModificationDetailResponse.error("No modification records found");
        }

        UD06ModificationDetailResponse.DataInfo data = new UD06ModificationDetailResponse.DataInfo();
        HdocAdcaModification first = mods.get(0);
        data.setDoctype(first.getDoctype());
        data.setVersion(first.getVers() != null ? first.getVers().toString() : "1.0.0");

        // Build storing info string
        String storingInfo = mods.stream()
                .map(m -> m.getVariable() + "=" + (m.getNewval() != null ? m.getNewval() : ""))
                .collect(Collectors.joining("; "));
        data.setStoringInfo(storingInfo);
        data.setFoundUnreleasedVersion("1");

        return UD06ModificationDetailResponse.success(data);
    }
}
