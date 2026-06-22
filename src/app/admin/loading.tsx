export default function AdminLoading() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '32px 28px', maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ height: 28, width: 180, borderRadius: 8, background: '#E4E8EF', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: 16, width: 280, borderRadius: 6, background: '#EEF0F5', animation: 'pulse 1.4s ease-in-out infinite 0.1s' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 8 }}>
                {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 100, borderRadius: 12, background: '#EEF0F5', animation: `pulse 1.4s ease-in-out infinite ${i * 0.08}s` }} />
                ))}
            </div>
            <div style={{ height: 200, borderRadius: 12, background: '#EEF0F5', animation: 'pulse 1.4s ease-in-out infinite 0.3s' }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
    );
}
