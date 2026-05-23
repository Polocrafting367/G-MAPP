const pieces = {
    "Zone A (Quincaillerie)": {
        "1 Colonne": {
            "A": {
                "1": {
                    "Vis H M8x30 Acier 8.8 _ A1A01": {
                        "id": "202301150001",
                        "barcode": "005001",
                        "place": "A1A01"
                    },
                    "Vis H M10x50 Acier 8.8 _ A1A01": {
                        "id": "202301150002",
                        "barcode": "005002",
                        "place": "A1A01"
                    },
                    "Rondelle plate M8 Zinguée (Boite 100) _ A1A01": {
                        "id": "202301150003",
                        "barcode": "005003",
                        "place": "A1A01"
                    }
                },
                "2": {
                    "Ecrou frein Nylstop M8 _ A1A02": {
                        "id": "202302200010",
                        "barcode": "005010",
                        "place": "A1A02"
                    },
                    "Ecrou frein Nylstop M10 _ A1A02": {
                        "id": "202302200011",
                        "barcode": "005011",
                        "place": "A1A02"
                    }
                }
            },
            "B": {
                "1": {
                    "Tige filetée M12 (1 mètre) _ A1B01": {
                        "id": "202303050050",
                        "barcode": "005100",
                        "place": "A1B01"
                    }
                }
            }
        },
        "2 Colonne": {
            "A": {
                "Disque à tronçonner 125mm Inox _ A2A": {
                    "id": "202401100001",
                    "barcode": "006001",
                    "place": "A2A"
                },
                "Disque à meuler 125mm _ A2A": {
                    "id": "202401100002",
                    "barcode": "006002",
                    "place": "A2A"
                }
            },
            "B": {
                "Papier verre grain 120 _ A2B": {
                    "id": "202401100005",
                    "barcode": "006005",
                    "place": "A2B"
                },
                "Papier verre grain 240 _ A2B": {
                    "id": "202401100006",
                    "barcode": "006006",
                    "place": "A2B"
                }
            }
        }
    },
    "Zone B (Électricité)": {
        "1 Colonne": {
            "A": {
                "10": {
                    "Disjoncteur 10A Courbe C _ B1A10": {
                        "id": "202211150020",
                        "barcode": "007001",
                        "place": "B1A10"
                    }
                },
                "11": {
                    "Disjoncteur 16A Courbe C _ B1A11": {
                        "id": "202211150021",
                        "barcode": "007002",
                        "place": "B1A11"
                    },
                    "Disjoncteur Moteur GV2 4-6A _ B1A11": {
                        "id": "202211150022",
                        "barcode": "007003",
                        "place": "B1A11"
                    }
                }
            },
            "B": {
                "Capteur Inductif M12 PNP NO _ B1B": {
                    "id": "202305050010",
                    "barcode": "007500",
                    "place": "B1B"
                },
                "Cellule Photoélectrique Réflex _ B1B": {
                    "id": "202305050011",
                    "barcode": "007501",
                    "place": "B1B"
                }
            }
        },
        "2 Colonne": {
            "Cable": {
                "Cable RO2V 3G2.5mm² (Couronne 100m) _ B2C": {
                    "id": "202306010001",
                    "barcode": "008001",
                    "place": "B2C"
                },
                "Cable Réseau RJ45 Cat6 (3 mètres) _ B2C": {
                    "id": "202306010002",
                    "barcode": "008002",
                    "place": "B2C"
                }
            }
        }
    },
    "Zone C (Mécanique & Fluides)": {
        "1 Colonne": {
            "1": {
                "Roulement à billes 6004 2RS _ C11": {
                    "id": "202109010030",
                    "barcode": "009001",
                    "place": "C11"
                },
                "Roulement à billes 6205 ZZ _ C11": {
                    "id": "202109010031",
                    "barcode": "009002",
                    "place": "C11"
                }
            },
            "2": {
                "Palier applique carré 25mm _ C12": {
                    "id": "202109010040",
                    "barcode": "009010",
                    "place": "C12"
                }
            }
        },
        "2 Colonne": {
            "Vannes": {
                "Vanne à boule 1/2\" FF _ C2V": {
                    "id": "202204040001",
                    "barcode": "010001",
                    "place": "C2V"
                },
                "Vanne à boule 3/4\" FF _ C2V": {
                    "id": "202204040002",
                    "barcode": "010002",
                    "place": "C2V"
                },
                "Electrovanne 24V DC 2 voies _ C2V": {
                    "id": "202204040003",
                    "barcode": "010003",
                    "place": "C2V"
                }
            },
            "Joints": {
                "Pochette joints toriques assortiment _ C2J": {
                    "id": "202301010005",
                    "barcode": "010020",
                    "place": "C2J"
                },
                "Ruban Téflon PTFE 12mm _ C2J": {
                    "id": "202301010006",
                    "barcode": "010021",
                    "place": "C2J"
                }
            }
        }
    },
    "Zone D (EPI & Consommables)": {
        "Armoire Sécurité": {
            "Gants": {
                "Gants manutention T9 (Paquet 10) _ D1G": {
                    "id": "202402010001",
                    "barcode": "011001",
                    "place": "D1G"
                },
                "Gants Nitrile usage unique L (Boite 100) _ D1G": {
                    "id": "202402010002",
                    "barcode": "011002",
                    "place": "D1G"
                }
            },
            "Masques": {
                "Masque FFP2 (Boite 20) _ D1M": {
                    "id": "202402010005",
                    "barcode": "011005",
                    "place": "D1M"
                }
            }
        },
        "Produits Chimiques": {
            "Aérosols": {
                "Dégrippant WD-40 500ml _ D2A": {
                    "id": "202403150001",
                    "barcode": "012001",
                    "place": "D2A"
                },
                "Nettoyant Freins 600ml _ D2A": {
                    "id": "202403150002",
                    "barcode": "012002",
                    "place": "D2A"
                },
                "Graisse Blanche Lithium Spray _ D2A": {
                    "id": "202403150003",
                    "barcode": "012003",
                    "place": "D2A"
                }
            }
        }
    },
    "Hors Magasin": {
        "Atelier Mécanique": {
            "Servante 1": {
                "Jeu de clés mixtes 8-22mm Facom _ HM1": {
                    "id": "202005050001",
                    "barcode": "090001",
                    "place": "HM1"
                }
            }
        },
        "Réception": {
            "Colis en attente": {
                "Moteur asynchrone 0.75kW (Commande urgente) _ REC": {
                    "id": "202506010099",
                    "barcode": "099999",
                    "place": "REC"
                }
            }
        }
    }
};