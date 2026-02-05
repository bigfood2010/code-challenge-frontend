import React from 'react';
import styles from './ParallaxBackground.module.css';

export const ParallaxBackground: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.aura1} />
      <div className={styles.aura2} />
      <div className={styles.blob} />
    </div>
  );
};
