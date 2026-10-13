/**
 * ============================================================
 * 4_Frontend_Logic.js
 * OUTPUT: Integrasi API Apps Script & Manipulasi Form UI
 * ============================================================
 */

// TODO: MASUKKAN URL WEB APP ANDA DI SINI
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIkeTglGcowMwb9l7mQ6BZFpgk9r6CV2Z-m3rM5OaXAafwiF6t2181NrwZ0vpRrLq7Jg/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("main-form");
  const actionInput = document.getElementById("input-action");
  const btnSubmit = document.getElementById("submit-btn");
  const identitasSection = document.getElementById("identitas-section");
  const nomorInput = document.getElementById("nomor_pemesanan");
  const alertBox = document.getElementById("alert-box");
  
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");

  // LOGIKA AUTOCOMPLETE & VALIDASI DATABASE JSON
  const autocompleteList = document.getElementById("autocomplete-list");
  let validNumbers = [];
  let fullDataList = [];
  
  async function loadValidNumbers() {
    try {
      const response = await fetch('do_all.json');
      const rawData = await response.json();
      
      if (rawData && rawData.data) {
       fullDataList = rawData.data.map(row => ({
          nomor: row[0].toString(),
          nim: row[1] ? row[1].toString() : "Data tidak ditemukan",
          upbjj: row[2] ? row[2].toString() : "Data tidak ditemukan"
        }));
        validNumbers = fullDataList.map(item => item.nomor);
      }
    } catch (error) {
      console.error("Gagal memuat database nomor:", error);
    }
  }
  loadValidNumbers();
  
  nomorInput.addEventListener("input", function () {
    const val = this.value.trim();
    autocompleteList.innerHTML = "";
    autocompleteList.classList.add("hidden");
    if (!val) return;
    
    const filtered = validNumbers.filter(num => num.includes(val)).slice(0, 5);
    if (filtered.length > 0) {
      autocompleteList.classList.remove("hidden");
      
      filtered.forEach(num => {
        const div = document.createElement("div");
        const regex = new RegExp(`(${val})`, "gi");
        div.innerHTML = num.replace(regex, "<strong>$1</strong>");
        
        div.addEventListener("click", function () {
          nomorInput.value = num;
          autocompleteList.innerHTML = "";
          autocompleteList.classList.add("hidden");
        });
        autocompleteList.appendChild(div);
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target !== nomorInput) {
      autocompleteList.innerHTML = "";
      autocompleteList.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const originalBtnText = btnSubmit.innerText;
    btnSubmit.innerText = "Memproses, mohon tunggu...";
    btnSubmit.disabled = true;
    showAlert("", "hidden");

    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());

    // Validasi 1: Pastikan Panjang Karakter antara 20 - 22 digit
    const nomorDiketik = dataObj.nomor_pemesanan.trim();
    if (nomorDiketik.length < 20 || nomorDiketik.length > 22) {
      showAlert("Nomor Pemesanan harus antara 20 hingga 22 digit.", "error");
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
      return; 
    }

   // Validasi 2: Pastikan nomor terdaftar di database JSON
    if (actionInput.value === "cek" && !validNumbers.includes(nomorDiketik)) {
      showAlert("Nomor Pemesanan tidak terdaftar di database. Silakan periksa kembali.", "error");
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
      return; 
    }

    // --- TAMBAHAN BARU: Validasi Manual di Tahap 2 ---
    if (actionInput.value === "simpan") {
      const nimDiketik = document.getElementById("nim").value.trim();
      const upbjjDiketik = document.getElementById("nama_upbjj").value.trim();
      const alasanReturDiketik = document.getElementById("alasan_retur").value.trim();
      
      if (nimDiketik === "" || upbjjDiketik === "" || alasanReturDiketik === "") {
        showAlert("Semua identitas (NIM, UT Daerah, dan Alasan Retur) wajib diisi.", "error");
        btnSubmit.innerText = originalBtnText;
        btnSubmit.disabled = false;
        return;
      }
    }
    // -------------------------------------------------------

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(dataObj),
        redirect: "follow"
      });

      const result = await response.json();
      handleResponse(result);

    } catch (error) {
      showAlert("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.", "error");
    } finally {
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
    }
  });

  function handleResponse(res) {
    const actionState = actionInput.value;

    if (actionState === "cek") {
      if (res.status === "sudah_terdata") {
        showAlert(res.pesan, "error");
      } else if (res.status === "belum_terdata") {
        
        // AUTOFILL Identitas & Buka Blokir Kolom
        const matchedData = fullDataList.find(d => d.nomor === nomorInput.value.trim());
        if (matchedData) {
          document.getElementById("nim").value = matchedData.nim;
          document.getElementById("nama_upbjj").value = matchedData.upbjj;
        }
        
        showAlert("Nomor ditemukan! Silakan lengkapi alasan retur.", "success");
        nomorInput.readOnly = true;
        identitasSection.classList.remove("hidden");
        
        step1.classList.remove("active");
        step2.classList.add("active");

        actionInput.value = "simpan";
        btnSubmit.innerText = "Simpan Data Retur";
      } else {
        showAlert(res.pesan, "error");
      }
    } 
    else if (actionState === "simpan") {
      if (res.status === "success") {
        showAlert("Berhasil! " + res.pesan, "success");
        
        form.reset();
        identitasSection.classList.add("hidden");
        nomorInput.readOnly = false;
        
        step2.classList.remove("active");
        step1.classList.add("active");

        actionInput.value = "cek";
        btnSubmit.innerText = "Cek Nomor Pemesanan";
      } else {
        showAlert(res.pesan, "error");
      }
    }
  }

  function showAlert(message, type) {
    alertBox.innerText = message;
    alertBox.className = "alert " + type;
  }
});
