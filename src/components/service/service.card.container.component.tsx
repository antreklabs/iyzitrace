import React, { useRef } from 'react';
import { Service } from '../../api/service/interface.service';
import ServiceMetricsCard from './service.container.card.component';

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
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => scrollBy(-400)}
        style={{ 
          position: 'absolute', 
          left: 0, 
          top: '50%', 
          transform: 'translateY(-50%)', 
          zIndex: 1, 
          background: '#1f1f1f', 
          border: '1px solid #303030', 
          color: '#d9d9d9', 
          borderRadius: 6, 
          padding: '4px 8px',
          cursor: 'pointer'
        }}
      >
        ◀
      </button>
      <div
        ref={scrollerRef}
        style={{ 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          whiteSpace: 'nowrap', 
          padding: '0 36px' 
        }}
      >
        <div style={{ display: 'inline-flex', gap: 16 }}>
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
        style={{ 
          position: 'absolute', 
          right: 0, 
          top: '50%', 
          transform: 'translateY(-50%)', 
          zIndex: 1, 
          background: '#1f1f1f', 
          border: '1px solid #303030', 
          color: '#d9d9d9', 
          borderRadius: 6, 
          padding: '4px 8px',
          cursor: 'pointer'
        }}
      >
        ▶
      </button>
    </div>
  );
};

export default ServiceCardContainer;

