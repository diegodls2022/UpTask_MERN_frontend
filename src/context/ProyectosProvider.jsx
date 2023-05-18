import { useState, useEffect, createContext} from 'react'
import clienteAxios from '../config/clienteAxios'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'

let socket;

const ProyectosContext = createContext();

const ProyectosProvider = ({children}) => {
 
    const [proyectos, setProyectos] = useState([]);
    const [alerta, setAlerta] = useState({});
    const [proyecto, setProyecto] = useState({});
    const [cargando, setCargando] = useState(false);
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [tarea, setTarea] = useState({})
    const [modalEliminarTarea, setModalEliminarTarea] = useState(false)
    const [modalEliminarColaborador, setModalEliminarColaborador] = useState(false)
    const [colaborador, setColaborador] = useState({})
    const [buscador, setBuscador] = useState(false)


    const navigate = useNavigate();
    const { auth } = useAuth()

    useEffect(() => {
        const obtenerProyecto = async () => {
            try {
                const token = localStorage.getItem('token')
                    if(!token) return 
          
                    const config = {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                             }
                    }

                    const { data } = await clienteAxios('/proyectos', config)
                    setProyectos(data)
            } catch (error) {
                console.log(error)
            }
        }
        obtenerProyecto()
    },[auth])

    useEffect(() => {
        socket = io(import.meta.env.VITE_BACKEND_URL)
    },[])

    const mostrarAlerta = alerta => {
        setAlerta(alerta)

        setTimeout(() => {
            setAlerta({})
        }, 5000);
    }

    const submitProyecto = async proyecto => {

            if(proyecto.id) {
                await editarProyecto(proyecto)
            } else {
                await nuevoProyecto(proyecto)
            } 
    }

    const editarProyecto = async proyecto => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
            
            const config = {
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                  }
            }

            const { data } = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
            // sincronizar el state
                const proyectoActualizados = proyectos.map(proyectoState => proyectoState._id === data._id ? data : proyectoState)
                setProyectos(proyectoActualizados)

                // mostrar la alerta
                setAlerta({
                    msg: 'Proyecto Actualizado Correctamente',
                    error: false
                  })
        
                  setTimeout(() => {
                    setAlerta({})
                    navigate('/proyectos')
                  }, 3000);
                } catch (error) {
                    console.log(error)
                }
    }

    const nuevoProyecto = async proyecto => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
            
            const config = {
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                  }
            }
  
            const { data } = await clienteAxios.post('/proyectos', proyecto, config)
            
            setProyectos([...proyecto, data])
  
            setAlerta({
              msg: 'Proyecto Creado Correctamente',
              error: false
            })
  
            setTimeout(() => {
              setAlerta({})
              navigate('/proyectos')
            }, 3000);
          } catch (error) {
              console.log(error)
          }
    }

    const obtenerProyecto = async id => {
        setCargando(true) 
        try {
            const token = localStorage.getItem('token')
                if(!token) return 
          
          const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
          }

          const { data } = await clienteAxios(`/proyectos/${id}`, config)
          setProyecto(data)
          setAlerta({})
        } catch (error) {
            navigate('/proyectos')
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
            setTimeout(() => {
                setAlerta({})
            }, 3000);Pro
        } finally {
            setCargando(false)
        }
    }

    const eliminarProyecto = async id => {
        try {
            const token = localStorage.getItem('token')
                if(!token) return 
            
            const config = {
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                  }
            }
  
            const { data } = await clienteAxios.delete(`/proyectos/${id}`, config)

            // sincronizar el state
            const proyectosActualizados = proyectos.filter(proyectoState => proyectoState._id !== id)
            setProyectos(proyectosActualizados)

            // mostrar la alerta
            setAlerta({
                msg: data.msg,
                error: false
            })

            setTimeout(() => {
                setAlerta({})
                navigate('/proyectos')
              }, 3000);
        } catch (error) {
            console.log(error)
        }
    }

    const handleModaltarea = () => {
        setModalFormularioTarea(!modalFormularioTarea)
        setTarea({})
    }

    const submitTarea = async tarea => {

        if(tarea?.id) {
            await editarTarea(tarea)
        } else {
            await crearTarea(tarea)
        }
        
    }

    const crearTarea = async tarea => {
        try {
            const token = localStorage.getItem('token')
                if(!token) return 
        
        const config = {
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              }
        }

         const { data } = await clienteAxios.post('/tareas', tarea, config)  
         
                setAlerta({})
                setModalFormularioTarea(false)

            // socket io
            socket.emit("nueva tarea", data)    
        } catch (error) {
            console.log(error)
        }
    }

    const editarTarea = async tarea => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }

        const { data } = await clienteAxios.put(`/tareas/${tarea.id}`, tarea, config)
        
        setAlerta({})
        setModalFormularioTarea(false)

        // socket
        socket.emit("actualizar tarea", data)

        } catch (error) {
            console.log(error)
        }
    }

    const handleModalEditarTarea = tarea => {
        setTarea(tarea)
        setModalFormularioTarea(true)
    }
    
    const handleModalEliminarTarea = tarea => {
        setTarea(tarea)
        setModalEliminarTarea(!modalEliminarTarea)
    }

    const eliminarTarea = async () => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }

        const { data } = await clienteAxios.delete(`/tareas/${tarea._id}`, config)
        setAlerta({
            msg: data.msg,
            error: false
        })
    
        setModalEliminarTarea(false)

        // socket
        socket.emit("eliminar tarea", tarea)

        setTarea({})

        setTimeout(() => {
            setAlerta({})
        }, 3000)

        } catch (error) {
            console.log(error)
        }
    }

    const submitColaborador = async email => {
       setCargando(true) 
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }

            const { data } = await clienteAxios.post('/proyectos/colaboradores', {email}, config)
            setColaborador(data)
            setAlerta({})
        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
        } finally {
            setCargando(false)
        }

    }
    
    const agregarColaborar = async email => {
        
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }
        
            const { data } = await clienteAxios.post(`/proyectos/colaboradores/${proyecto._id}`, email, config)

            setAlerta({
                msg: data.msg,
                error: false
            })
            setColaborador({})

            setTimeout(() => {
                setAlerta({})
            }, 3000);
        
        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
        }
    }

    const handleModalEliminarColaborador = (colaborador) => {
        setModalEliminarColaborador(!modalEliminarColaborador)
        setColaborador(colaborador)
    }

    const eliminarColaborador = async () => {
     
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }

        const { data } = await clienteAxios.post(`/proyectos/eliminar-colaborador/${proyecto._id}`, { id: colaborador._id}, config)
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.colaboradores = proyectoActualizado.colaboradores.filter(colaboradorstate => colaboradorstate._id !== colaborador._id)
        setProyecto(proyectoActualizado)

        setAlerta({
            msg: data.msg,
            error: false
        })
        setColaborador({})
        setModalEliminarColaborador(false)


        setTimeout(() => {
            setAlerta({})
        }, 3000);

        } catch (error) {
            console.log(error.response)
        }
    }

    const completarTarea = async id => {
       
        try {
            const token = localStorage.getItem('token')
            if(!token) return 
    
        const config = {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
                }
        }

        const { data } = await clienteAxios.post(`/tareas/estado/${id}`, {}, config)
      
        setTarea({})
        setAlerta({}) 

        // Socket
        socket.emit("cambiar estado", data)

        } catch (error) {
            console.log(error.response)
        }
    } 

    const handleBuscador = () => {
        setBuscador(!buscador)
    }

    // socket Io

    const submitTareasProyecto = (tarea) => {
    // Agrega la tarea al State
          const proyectoActualizado = {...proyecto}
             proyectoActualizado.tareas = [...proyectoActualizado.tarea, tarea ]
             setProyecto(proyectoActualizado)
    }

    const eliminarTareaProyecto = tarea => {
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = proyectoActualizado.tareas.filter( tareaState => tareaState._id !== tarea._id)
        setProyecto(proyectoActualizado)
    }

    const actualizarTareaProyecto = tarea => {
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = proyectoActualizado.tareas.map( tareaState => tareaState._id === tarea._id ? tarea : tareaState)
        setProyecto(proyectoActualizado)
    }

    const cambiarEstadoTarea = tarea => {
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tarea = proyectoActualizado.tarea.map(tareastate => tareastate._id === tarea._id ? tarea : tareastate)
        setProyecto(proyectoActualizado)      
    }

    const cerrarSesionProyectos = () => {
        setProyectos([])
        setProyecto({})
        setAlerta({})
    }

    return (
        <ProyectosContext.Provider
            value={{
                proyectos,
                mostrarAlerta,
                alerta,
                submitProyecto,
                obtenerProyecto,
                proyecto,
                cargando,
                eliminarProyecto,
                modalFormularioTarea,
                handleModaltarea,
                submitTarea,
                handleModalEditarTarea,
                tarea,
                modalEliminarTarea,
                handleModalEliminarTarea,
                eliminarTarea,
                submitColaborador,
                colaborador,
                agregarColaborar,
                handleModalEliminarColaborador,
                modalEliminarColaborador,
                eliminarColaborador,
                completarTarea,
                buscador,
                handleBuscador,
                submitTareasProyecto,
                eliminarTareaProyecto,
                actualizarTareaProyecto,
                cambiarEstadoTarea,
                cerrarSesionProyectos
            }}
        >
         {children}   
        </ProyectosContext.Provider>
    )
}

export {
    ProyectosProvider
}

export default ProyectosContext
