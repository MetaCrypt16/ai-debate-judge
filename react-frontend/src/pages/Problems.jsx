import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

export default function Problems(){
  const [problems, setProblems] = useState([])

  useEffect(()=>{
    api.get('/problems').then(r=> setProblems(r.data.problems)).catch(console.error)
  },[])

  return (
    <div>
      <h2>Problems</h2>
      <ul>
        {problems.map(p => (
          <li key={p.id}><Link to={`/problems/${p.id}`}>{p.title} ({p.difficulty})</Link></li>
        ))}
      </ul>
    </div>
  )
}
