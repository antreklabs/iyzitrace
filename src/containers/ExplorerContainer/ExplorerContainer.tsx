import React, { useEffect } from "react";
import { Card } from "antd";
import TraceFilterBar from "./TraceFilterBar";
import "./ExplorerContainer.css";
import {tempoApi} from "../../providers";

const ExplorerContainer = ()=>{
    const getServices = async () => {
        const res = await tempoApi.getServices();
        return res.data;
    };

    useEffect(() => {
        getServices();
    }, []);
    return (
        <Card title={ <TraceFilterBar />}>
           
        </Card>
    )
}

export default ExplorerContainer;
