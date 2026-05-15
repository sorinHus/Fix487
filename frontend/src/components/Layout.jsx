import Navbar from './Navbar';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
