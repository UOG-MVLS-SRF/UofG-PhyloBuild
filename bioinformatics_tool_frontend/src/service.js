import axios from 'axios';

class ApiService {
  apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
  
  //Changed to give webpage access to upload errors
  uploadData = async (session_id, filename, filedata, tag) => {
    return axios.post(this.apiEndpoint + "/upload_files/", {
      'id': session_id,
      'name': filename,
      'data': filedata,
      'tag': tag,
    });

  };

  uploadEmail = async (session_id, email) => {
    return axios.post(this.apiEndpoint + "/upload_email/", {
      'id': session_id,
      'email': email,
    }).then(response => {
      return response;
    }).catch(response => {
      console.log(response)
      return response;
    });
  };

  uploadSampleSheet = async (session_id, data) => {
    return axios.post(this.apiEndpoint + "/upload_sample_sheet/", {
      'id': session_id,
      'data': data,
    }).then(response => {
      return response;
    }).catch(response => {
      console.log(response)
      return response;
    });
  };

  uploadFromDatabase = async (session_id, tag) => {
    
    return await axios.post(this.apiEndpoint + "/upload_genome_database/", {
      'id': session_id,
      'tag': tag,
    }).then(response => {
      console.log(response)
      return response;
    }).catch(response => {
      return response;
    });
  };

  submitExec = async (
    session_id,
    virulence = false,
    plasmids=false,
    run_type = "phylotree",
    database_genomes = [],
    database_ref_genome = [],
    database_outgroup_genome = [],
    display_names = {},
    species = "other"
  ) => {

    console.log("SUBMIT EXEC:", {
      session_id,
      virulence,
      plasmids,
      run_type,
      database_genomes,
      database_ref_genome,
      database_outgroup_genome,
      display_names,
      species
    });

    return await axios.post(
      this.apiEndpoint + "/submit_exec/", {
        "id": session_id,
        "virulence": virulence,
        "plasmids": plasmids,
        "run_type": run_type,
        "database_genomes": database_genomes,
        "database_ref_genome": database_ref_genome,
        "database_outgroup_genome": database_outgroup_genome,
        "display_names": display_names,
        "species":species
      }
    ).then(response => {
      return response;
    }).catch(response => {
      console.error(response);
      return response;
    });
  }

  deleteFile = async (session_id, file_type, file_name) => {
    return await axios.put(this.apiEndpoint+`/delete_file/${session_id}/${file_type}/${file_name}/`)
    .then(response => {return response})
        .catch(response =>{console.error(response)
    return response})
  }

  clearAll = async (session_id, file_type) => {
    return await axios.put(this.apiEndpoint+`/delete_all/${session_id}/${file_type}/`)
    .then(response => {return response})
        .catch(response =>{console.error(response)
    return response})
  }
  getResults = async (session_id) => {
    // validateStatus: never throw - we inspect the status code ourselves
    // (200 = zip blob, 202 = still processing, 404 = not found).
    return await axios.get(this.apiEndpoint + `/download_results/${session_id}/`, {
      responseType: 'blob',
      validateStatus: () => true,
    }).then(response => response).catch(error => error);
  }

  getResultsStatus = async (session_id) => {
    // 200 {status:"ready", images:[...], tables:[...]}, 202 processing, 404 not found
    return await axios.get(this.apiEndpoint + `/results_status/${session_id}/`, {
      validateStatus: () => true,
    }).then(response => response).catch(error => error);
  }

  resultFileUrl = (session_id, filename) => {
    return this.apiEndpoint + `/result_file/${session_id}/${filename}/`;
  }

  getResultText = async (session_id, filename) => {
    // fetch a TSV result file as plain text for inline table rendering
    return await axios.get(this.resultFileUrl(session_id, filename), {
      responseType: 'text',
      validateStatus: () => true,
    }).then(response => response).catch(error => error);
  }

  submitOffset = async (session_id, offset) => {
    return await axios.post(this.apiEndpoint+"/offset_tune/", {"id":session_id, "offset":offset})
    .then(response => {return response})
        .catch(response =>{console.error(response)
    return response})
  }

  getGenomeLibrary = async () => {
    return axios.get(
      this.apiEndpoint + "/genome_library/"
    );
  };

} 

export default new ApiService();

