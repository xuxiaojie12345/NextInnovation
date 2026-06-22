package com.web.app.service.impl;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.service.UD16ADChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD16 - AD Change操作服务实现类
 */
@Service
public class UD16ADChangeServiceImpl implements UD16ADChangeService {

    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;

    @Override
    public UD16ADChangeResponse selectHdocAdcaChange(UD16ADChangeRequest request) {
        UD16ADChangeResponse response = new UD16ADChangeResponse();

        if (request.getSerieChnr() == null || request.getDesc() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        HdocAdcaChange data = hdocAdcaChangeMapper.selectByCondition(request.getSerieChnr(), request.getDesc());

        response.setCode(200);
        response.setMsg("没有错误");
        response.setData(data);
        return response;
    }

    @Override
    public UD16ADChangeResponse insertHdocAdcaChange(UD16ADChangeRequest request) {
        UD16ADChangeResponse response = new UD16ADChangeResponse();

        if (request.getSerieChnr() == null || request.getDesc() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        // 先检查是否存在
        HdocAdcaChange existing = hdocAdcaChangeMapper.selectByCondition(request.getSerieChnr(), request.getDesc());
        if (existing != null) {
            response.setCode(400);
            response.setMsg("记录已存在");
            return response;
        }

        // 新增
        HdocAdcaChange change = new HdocAdcaChange();
        change.setSerie(request.getSerieChnr());
        change.setChnr(request.getDesc());
        change.setAct("Y");
        change.setBu(request.getBu() != null ? request.getBu() : "");
        change.setRegisterUser(request.getUser());
        change.setUpdateUser(request.getUser());

        hdocAdcaChangeMapper.insert(change);

        response.setCode(200);
        response.setMsg("追加成功");
        return response;
    }

    @Override
    public UD16ADChangeResponse updateHdocAdcaChange(UD16ADChangeRequest request) {
        UD16ADChangeResponse response = new UD16ADChangeResponse();

        if (request.getSerieChnr() == null || request.getDesc() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        // 先检查是否存在
        HdocAdcaChange existing = hdocAdcaChangeMapper.selectByCondition(request.getSerieChnr(), request.getDesc());
        if (existing == null) {
            response.setCode(404);
            response.setMsg("记录不存在");
            return response;
        }

        // 逻辑删除
        hdocAdcaChangeMapper.updateActToN(request.getSerieChnr(), request.getDesc());

        response.setCode(200);
        response.setMsg("删除成功");
        return response;
    }
}
