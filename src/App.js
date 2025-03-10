import "./App.css";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import React, { useEffect, useState } from "react";

function App() {
  //Definir columnas para DataTable
  const columns = [
    { 
      name: "Empresa", selector: (row) => row.nombre_empresa || "No especificado", sortable: true 
    },
    { 
      name: "Área", selector: (row) => row.nombre_area || "No especificado", sortable: true 
    },
    { 
      name: "Trabajador", selector: (row) => row.nombre_trabajador || "No registrado", sortable: true 
    },
    { 
      name: "RUT", selector: (row) => row.rut_trabajador || "No registrado", sortable: true 
    },
    { 
      name: "Edad", selector: (row) => row.edad || "No especificado", sortable: true, right: true 
    },
    { 
      name: "Profesión", selector: (row) => row.profesion || "No especificado", sortable: true 
    },
    { 
      name: "Cargo", selector: (row) => row.cargo || "No especificado", sortable: true 
    },
    { 
      name: "Sueldo", selector: (row) => row.sueldo || "N/A", sortable: true, right: true 
    },
  ];

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar archivo Json
        const jsonResponse = await fetch("/dicionario-de-datos.json");
        const jsonData = await jsonResponse.json();

        // Cargar y leer archivo excel
        const response = await fetch("/origen-datos-junior.xlsx");
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = (e) => {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0]; // Seleccionar primera hoja de excel
          const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

          // Unificar datos de Json y excel en base a la relacion de estos
          const mergedData = excelData.map((trabajador) => {
            const empresa = jsonData.EMPRESAS.find((e) => e.ID_EMPRESA === trabajador.ID_EMPRESA);
            const area = empresa?.AREAS.find((a) => a.ID_AREA === trabajador.ID_AREA);

            return {
              nombre_empresa: empresa?.NOMBRE_EMPRESA || "Desconocido",
              nombre_area: area?.NOMBRE_AREA || "Desconocido",
              sueldo: area ? area.SUELDO.toLocaleString("es-CL", { style: "currency", currency: "CLP" }) : "N/A",
              nombre_trabajador: trabajador.NOMBRE_TRABAJADOR || "No registrado",
              rut_trabajador: trabajador.RUT_TRABAJADOR || "No registrado",
              edad: trabajador.EDAD || "No especificado",
              profesion: trabajador.PROFESION || "No especificado",
              cargo: trabajador.CARGO || "No especificado",
            };
          });

          setData(mergedData);
          setFilteredData(mergedData);
          setLoading(false);
        };

        reader.readAsBinaryString(blob);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar datos en tiempo real
  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearch(searchTerm);

    const filtered = data.filter(
      (row) =>
        row.nombre_empresa.toLowerCase().includes(searchTerm) ||
        row.nombre_area.toLowerCase().includes(searchTerm) ||
        row.nombre_trabajador.toLowerCase().includes(searchTerm) ||
        row.rut_trabajador.toLowerCase().includes(searchTerm) ||
        row.profesion.toLowerCase().includes(searchTerm) ||
        row.cargo.toLowerCase().includes(searchTerm)
    );

    setFilteredData(filtered);
  };

  // Exportacion excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos Filtrados");
    XLSX.writeFile(wb, "Data_ReSimple.xlsx");
  };

  const customStyles = {
    headCells: {
      style: {
        fontWeight: "bold", // Hace el texto en la cabecera en negrita
        backgroundColor: "#61CE70", // Color de fondo opcional
        fontSize: "16px", // Tamaño de fuente opcional
      },
    },
  };

  return (
    // Filtro de datos
    <div class="container-fluid">
    <br></br>
    <div class="row">
      <div class="col-md-3">
      <input type="text" placeholder="Buscar..." value={search} onChange={handleSearch}
        style={{
          marginBottom: "10px",
          padding: "8px",
          width: "300px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      />
      </div>
      <div class="col-md-7">

      </div>
      <div class="col-md-2">
      {/*Boton exportar excel*/}
      <button onClick={exportToExcel}
        style={{
          marginBottom: "10px",
          marginLeft: "10px",
          padding: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        Exportar a Excel
      </button>
      </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          {/* DataTable */}
          <DataTable title="ReSimple" columns={columns} data={filteredData} progressPending={loading} pagination customStyles={customStyles}/>
        </div>
      </div>
      
    </div>
  );
}

export default App;
