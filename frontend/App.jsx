import React, { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function useFetch(url, everyMs = 5000) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let timer
    const get = async () => {
      if (!url) return
      const res = await fetch(url)
      if (!res.ok) return
      const json = await res.json()
      setData(json)
    }
    get()
    timer = setInterval(get, everyMs)
    return () => clearInterval(timer)
  }, [url, everyMs])
  return data
}

function Table({ rows=[] }) {
  return (
    <table className="table">
      <thead><tr>
        <th>Instance</th><th>Region</th><th>CPU%</th><th>Mem%</th><th>Disk%</th><th>Net In</th><th>Net Out</th>
      </tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.instanceId}>
            <td>{r.name}</td>
            <td>{r.region}</td>
            <td>{r.cpu}</td>
            <td>{r.mem}</td>
            <td>{r.disk}</td>
            <td>{r.netIn}</td>
            <td>{r.netOut}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LineChart({ points=[], label='CPU %', field='cpu' }) {
  const data = useMemo(() => {
    const labels = points.map(p => new Date(p.ts).toLocaleTimeString())
    const values = points.map(p => p[field])
    return { labels, datasets: [{ label, data: values, tension: 0.3 }] }
  }, [points, field, label])

  const options = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } }
  }), [])

  return <Line data={data} options={options} />
}

export default function App() {
  const instRes   = useFetch('/api/instances', 15000)
  const latestRes = useFetch('/api/metrics/latest', 5000)
  const instances = instRes?.instances ?? []
  const latest    = latestRes?.metrics ?? []

  const [selected, setSelected] = useState(null)
  useEffect(() => { if (!selected && instances.length) setSelected(instances[0].id) }, [instances, selected])

  const histRes = useFetch(selected ? `/api/metrics/history/${selected}` : null, 5000)

  return (
    <div className="container">
      <header className="header">
        <div className="brand">CloudPulse</div>
        <a className="btn" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
      </header>

      <main>
        <section>
          <h1>Real-Time Cloud Infrastructure Monitoring</h1>
          <p>Mock AWS metrics via Node backend → live charts in React. Swap the mock generator with CloudWatch later.</p>

          <div className="row">
            <div className="card">
              <strong>Instances</strong><br/>
              {instances.map(i => (
                <button
                  key={i.id}
                  className="btn"
                  style={{ marginRight:8, marginTop:8, borderColor: selected===i.id ? '#59c3ff' : '#2a2e36' }}
                  onClick={() => setSelected(i.id)}
                >
                  {i.name} <span className="badge">{i.region}</span>
                </button>
              ))}
            </div>

            <div className="card">
              <strong>Latest Metrics</strong>
              <Table rows={latest} />
            </div>
          </div>
        </section>

        <section>
          <h2>History</h2>
          <div className="grid">
            <div className="card"><h3>CPU %</h3>    <LineChart points={histRes?.points ?? []} field="cpu"  label="CPU %" /></div>
            <div className="card"><h3>Memory %</h3> <LineChart points={histRes?.points ?? []} field="mem"  label="Memory %" /></div>
            <div className="card"><h3>Disk %</h3>   <LineChart points={histRes?.points ?? []} field="disk" label="Disk %" /></div>
          </div>
        </section>
      </main>

      <footer><small>© {new Date().getFullYear()} CloudPulse • Starter</small></footer>
    </div>
  )
}
