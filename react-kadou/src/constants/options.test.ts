/**
 * 拠点表記の正規化（normalizeLocation）のテスト
 *
 * 取込ファイルの N 列【労働関係所属地】は「済南」「天津」のような日本語表記で、
 * 部門マスタの location は「JN」「TJ」の英字コードのため、
 * 両者を比較する前に同じコードへ揃える必要がある。
 */
import { describe, expect, it } from '@jest/globals';
import { locationLabelOf, normalizeLocation } from '../constants/options';

describe('normalizeLocation', () => {
  it('日本語表記（済南 / 天津）を拠点コードへ変換する', () => {
    expect(normalizeLocation('済南')).toBe('JN');
    expect(normalizeLocation('天津')).toBe('TJ');
  });

  it('既に拠点コード（JN / TJ）の場合はそのまま返す', () => {
    expect(normalizeLocation('JN')).toBe('JN');
    expect(normalizeLocation('TJ')).toBe('TJ');
  });

  it('小文字・前後空白・全角スペースを吸収する', () => {
    expect(normalizeLocation(' jn ')).toBe('JN');
    expect(normalizeLocation('tj')).toBe('TJ');
    expect(normalizeLocation('\u3000済南\u3000')).toBe('JN');
  });

  it('簡体字・旧字体・ローマ字も受け付ける', () => {
    expect(normalizeLocation('济南')).toBe('JN');
    expect(normalizeLocation('濟南')).toBe('JN');
    expect(normalizeLocation('Jinan')).toBe('JN');
    expect(normalizeLocation('Tianjin')).toBe('TJ');
  });

  it('未対応の表記・空値は undefined を返す', () => {
    expect(normalizeLocation('東京')).toBeUndefined();
    expect(normalizeLocation('')).toBeUndefined();
    expect(normalizeLocation(undefined)).toBeUndefined();
    expect(normalizeLocation(null)).toBeUndefined();
  });
});

describe('locationLabelOf', () => {
  it('拠点コードを日本語名へ変換する', () => {
    expect(locationLabelOf('JN')).toBe('済南');
    expect(locationLabelOf('TJ')).toBe('天津');
  });

  it('未知の値はそのまま返す', () => {
    expect(locationLabelOf('XX')).toBe('XX');
    expect(locationLabelOf(undefined)).toBe('');
  });
});
