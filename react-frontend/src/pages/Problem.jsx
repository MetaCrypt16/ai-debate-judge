import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api'

export default function Problem(){
  const { id } = useParams()
  const [problem, setProblem] = useState(null)
  useEffect(()=>{
    api.get(`/problems/${id}`).then(r=> setProblem(r.data.problem)).catch(console.error)
  },[id])

  if(!problem) return <div>Loading...</div>
  return (
    <div>
      <h2>{problem.title}</h2>
      <p>Difficulty: {problem.difficulty}</p>
      <p>{problem.description}</p>

      <h3>Submit</h3>
      <p>Submission UI not implemented in scaffold. Use API POST /api/submissions</p>
    </div>
  )
}
