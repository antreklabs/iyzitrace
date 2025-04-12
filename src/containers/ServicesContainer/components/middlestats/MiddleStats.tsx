import { MiddleStatsProps } from "@/interfaces";
import { Col, Row } from "antd";
import React from "react";
import MiddleStatsCharts from "./MiddleStatsCharts";
import ErrorStatsCharts from "./ErrorStatsCharts";


const MiddleStats: React.FC<MiddleStatsProps> = ({
    serviceNames,
    start,
    end,
    range
})=>{
    return(
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col span={8}>
                <MiddleStatsCharts serviceNames={serviceNames} start={start} end={end} range={range}/>
            </Col>
            <Col span={16}>
                <ErrorStatsCharts serviceNames={serviceNames} start={start} end={end} range={range}/>
            </Col>
        </Row>
    )
}

export default MiddleStats;
