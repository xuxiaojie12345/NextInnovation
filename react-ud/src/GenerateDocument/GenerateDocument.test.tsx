// GenerateDocument.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenerateDocument from './GenerateDocument';

// Mock fetch API
global.fetch = jest.fn();

describe('GenerateDocument Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 清除localStorage
    localStorage.clear();
  });

  test('renders loading state initially', () => {
    render(<GenerateDocument />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('displays error message when chassis number is missing', async () => {
    render(<GenerateDocument />);
    
    await waitFor(() => {
      expect(screen.getByText(/Chassis number is required/i)).toBeInTheDocument();
    });
  });

  test('displays document data when API returns successfully', async () => {
    const mockData = {
      code: 200,
      msg: '查询成功',
      data: {
        serie: 'JPCT',
        chnr: '013945',
        model: 'IDO',
        spec: '201617',
        ordernumber: '15101319',
        build: '2016173',
        customerAdap: 'S1810111',
        countryOfOperation: 'IDO',
        loadIndex: 'FTLI-150',
        act: 'Y',
        variable: 'AXLE_CONF',
        newval: 'New Value',
        template: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf',
        generatedFilePath: '/path/to/file.trf',
        serverTime: '2022-12-06 07:30:31',
        programVersion: '4.2.1'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    // 设置URL参数
    window.history.pushState({}, '', '/generate-document?chassisNo=013945');

    render(<GenerateDocument />);

    await waitFor(() => {
      // 验证基本信息显示
      expect(screen.getByText(/Chassis series:/i)).toBeInTheDocument();
      expect(screen.getByText(/JPCT/i)).toBeInTheDocument();
      
      expect(screen.getByText(/Chassis no:/i)).toBeInTheDocument();
      expect(screen.getByText(/013945/i)).toBeInTheDocument();
      
      // 验证ADCA变更警告显示
      expect(screen.getByText(/After def change detected/i)).toBeInTheDocument();
      
      // 验证Modify Doc链接显示
      expect(screen.getByText(/Modify Doc/i)).toBeInTheDocument();
      
      // 验证Generated document链接显示
      expect(screen.getByText(/Generated document/i)).toBeInTheDocument();
      
      // 验证系统信息显示
      expect(screen.getByText(/Date:/i)).toBeInTheDocument();
      expect(screen.getByText(/2022-12-06 07:30:31/i)).toBeInTheDocument();
      
      expect(screen.getByText(/HDoc version:/i)).toBeInTheDocument();
      expect(screen.getByText(/4.2.1/i)).toBeInTheDocument();
    });
  });

  test('displays error message when API returns 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    window.history.pushState({}, '', '/generate-document?chassisNo=INVALID');

    render(<GenerateDocument />);

    await waitFor(() => {
      expect(screen.getByText(/Chassis not found/i)).toBeInTheDocument();
    });
  });

  test('displays error message when API returns 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    window.history.pushState({}, '', '/generate-document?chassisNo=013945');

    render(<GenerateDocument />);

    await waitFor(() => {
      expect(screen.getByText(/System error/i)).toBeInTheDocument();
    });
  });

  test('does not display ADCA warning when act is N', async () => {
    const mockData = {
      code: 200,
      msg: '查询成功',
      data: {
        serie: 'JPCT',
        chnr: '013945',
        model: 'IDO',
        spec: '201617',
        ordernumber: '15101319',
        build: '2016173',
        customerAdap: 'S1810111',
        countryOfOperation: 'IDO',
        loadIndex: 'FTLI-150',
        act: 'N',
        variable: '-',
        newval: '-',
        template: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf',
        generatedFilePath: '/path/to/file.trf',
        serverTime: '2022-12-06 07:30:31',
        programVersion: '4.2.1'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    window.history.pushState({}, '', '/generate-document?chassisNo=013945');

    render(<GenerateDocument />);

    await waitFor(() => {
      // 验证ADCA变更警告不显示
      expect(screen.queryByText(/After def change detected/i)).not.toBeInTheDocument();
      
      // 验证Modify Doc链接不显示
      expect(screen.queryByText(/Modify Doc/i)).not.toBeInTheDocument();
    });
  });

  test('displays S-Note message when customerAdap exists', async () => {
    const mockData = {
      code: 200,
      msg: '查询成功',
      data: {
        serie: 'JPCT',
        chnr: '013945',
        model: 'IDO',
        spec: '201617',
        ordernumber: '15101319',
        build: '2016173',
        customerAdap: 'S1810111',
        countryOfOperation: 'IDO',
        loadIndex: 'FTLI-150',
        act: 'N',
        variable: '-',
        newval: '-',
        template: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf',
        generatedFilePath: '/path/to/file.trf',
        serverTime: '2022-12-06 07:30:31',
        programVersion: '4.2.1'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    window.history.pushState({}, '', '/generate-document?chassisNo=013945');

    render(<GenerateDocument />);

    await waitFor(() => {
      // 验证S-Note消息显示
      expect(screen.getByText(/The S-Notes above can affect homologation documents/i)).toBeInTheDocument();
    });
  });

  test('does not display S-Note message when customerAdap is empty', async () => {
    const mockData = {
      code: 200,
      msg: '查询成功',
      data: {
        serie: 'JPCT',
        chnr: '013945',
        model: 'IDO',
        spec: '201617',
        ordernumber: '15101319',
        build: '2016173',
        customerAdap: '-',
        countryOfOperation: 'IDO',
        loadIndex: 'FTLI-150',
        act: 'N',
        variable: '-',
        newval: '-',
        template: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf',
        generatedFilePath: '/path/to/file.trf',
        serverTime: '2022-12-06 07:30:31',
        programVersion: '4.2.1'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    window.history.pushState({}, '', '/generate-document?chassisNo=013945');

    render(<GenerateDocument />);

    await waitFor(() => {
      // 验证S-Note消息不显示
      expect(screen.queryByText(/The S-Notes above can affect homologation documents/i)).not.toBeInTheDocument();
    });
  });
});
