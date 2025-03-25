import { Menu } from "antd"
import { title } from "process";
import React from "react";

const menu = [
    {
        title: "Dashboard",
        name: "dashboard",
        icon: "dashboard",
        route: "/dashboard",
        children: [
            {
                title: "Dashboard 1",
                name: "dashboard1",
                route: "/dashboard1",
            },
            {
                title: "Dashboard 2",
                name: "dashboard2",
                route: "/dashboard2",
            },
        ],
    },
    {
        title:"Search",
        name:"search",
        icon:"search",
        route:"/search",
    },
    {
        title:"Trace",
        name:"trace",
        icon:"search",
        route:"/trace",
    },
]

const LayoutMenu = () => {
    const { SubMenu } = Menu;
    return <Menu mode="horizontal" style={{minWidth: "50%",background: "transparent"}}> o
        {menu.map((item) => {
            if (item.children) {
                return <SubMenu key={item.name} title={item.title}>
                    {item.children.map((child) => {
                        return <Menu.Item key={child.name}>{child.title}</Menu.Item>
                    })}
                </SubMenu>
            }
            return <Menu.Item key={item.name}>{item.title}</Menu.Item>
        })}
    </Menu>

};

export default LayoutMenu;
