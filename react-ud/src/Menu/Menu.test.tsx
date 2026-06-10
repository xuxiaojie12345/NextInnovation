import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Menu from "./Menu";

// 包装组件以提供 Router 上下文
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Menu Component", () => {
  test("应该渲染 VOLVO Logo", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("VOLVO")).toBeInTheDocument();
  });

  test("应该显示所有5个分类", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("Generate Document")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("User Administration")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  test("Generate Document 分类应该有子分类 Generate", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });

  test("Generate 子分类应该有4个菜单项", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("Generate Doc")).toBeInTheDocument();
    expect(screen.getByText("Generate in Batch")).toBeInTheDocument();
    expect(screen.getByText("Regdata Archive")).toBeInTheDocument();
    expect(screen.getByText("Regdata Batch")).toBeInTheDocument();
  });

  test("Admin 分类应该有9个菜单项", () => {
    renderWithRouter(<Menu />);
    expect(
      screen.getByText("Update user defined variables (rules)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Update user defined variables (UNICODE rules)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Existing HDoc variables")).toBeInTheDocument();
    expect(screen.getByText("Unlock Document")).toBeInTheDocument();
    expect(screen.getByText("HDoc Number Series")).toBeInTheDocument();
    expect(screen.getByText("Upload/Delete template")).toBeInTheDocument();
    expect(
      screen.getByText("List available templates"),
    ).toBeInTheDocument();
    expect(screen.getByText("VPPS Vin plate")).toBeInTheDocument();
    expect(screen.getByText("AD/CA Change")).toBeInTheDocument();
  });

  test("User Administration 分类应该有5个菜单项", () => {
    renderWithRouter(<Menu />);
    expect(
      screen.getByText("HDoc User Administration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("HDoc User Doc Administration"),
    ).toBeInTheDocument();
    expect(screen.getByText("Search User")).toBeInTheDocument();
    expect(screen.getByText("Change Password")).toBeInTheDocument();
    expect(screen.getByText("User Position")).toBeInTheDocument();
  });

  test("Archive 分类应该有2个菜单项", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
  });

  test("Documentation 分类应该有5个菜单项", () => {
    renderWithRouter(<Menu />);
    expect(screen.getByText("User Guide")).toBeInTheDocument();
    expect(screen.getByText("AD/CA Change Guide")).toBeInTheDocument();
    expect(screen.getByText("Vin plate Guide FM/FH")).toBeInTheDocument();
    expect(screen.getByText("Archive Guide")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  test("总共应该显示25个菜单项", () => {
    renderWithRouter(<Menu />);
    const menuItems = screen.getAllByRole("button");
    expect(menuItems).toHaveLength(25);
  });

  test("菜单项应该包含 » 箭头符号", () => {
    renderWithRouter(<Menu />);
    const arrows = screen.getAllByText("»");
    expect(arrows.length).toBeGreaterThan(0);
  });

  test("菜单项应该是可点击的（具有 button role）", () => {
    renderWithRouter(<Menu />);
    const menuItems = screen.getAllByRole("button");
    menuItems.forEach((item) => {
      expect(item).toHaveAttribute("tabIndex", "0");
    });
  });

  test("分类标题应该使用深蓝色", () => {
    renderWithRouter(<Menu />);
    const categoryTitle = screen.getByText("Admin");
    expect(categoryTitle).toHaveStyle({ color: "#003057" });
  });
});
