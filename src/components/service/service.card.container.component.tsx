import React, { useRef } from 'react';
import { Service } from '../../api/service/interface.service';
import ServiceMetricsCard from './service.container.card.component';
import '../../assets/styles/components/service/service.styles';

interface ServiceCardContainerProps {
  services: Service[] | undefined;
}

const ServiceCardContainer: React.FC<ServiceCardContainerProps> = ({ services }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="service-card-scroll-wrapper">
      <button
        onClick={() => scrollBy(-400)}
        className="service-card-scroll-btn service-card-scroll-btn-left"
      >
        ◀
      </button>
      <div
        ref={scrollerRef}
        className="service-card-scroll-area"
      >
        <div className="service-card-scroll-inner">
          {services && services.map((service) => {
            return (
              <div key={service.id}>
                <ServiceMetricsCard service={service} />
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => scrollBy(400)}
        className="service-card-scroll-btn service-card-scroll-btn-right"
      >
        ▶
      </button>
    </div>
  );
};

export default ServiceCardContainer;