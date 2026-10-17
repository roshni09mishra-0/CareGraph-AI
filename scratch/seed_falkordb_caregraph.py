"""
CareGraph AI — FalkorDB Prototype Seeder & Cypher Traversal Engine
Graph Hacks Hackathon (Oct 2026)

Requirements:
    pip install falkordb
"""

import sys

try:
    from falkordb import FalkorDB
except ImportError:
    print("⚠️ FalkorDB driver not installed. Install via: pip install falkordb")
    FalkorDB = None

def seed_caregraph_database(host="127.0.0.1", port=6379, password=None):
    if not FalkorDB:
        print("Please install falkordb package first: pip install falkordb")
        return

    print("🔌 Connecting to FalkorDB instance...")
    db = FalkorDB(host=host, port=port, password=password)
    g = db.select_graph("CareGraphAI")

    print("🧹 Cleaning existing graph...")
    try:
        g.delete()
    except Exception:
        pass
    
    g = db.select_graph("CareGraphAI")

    print("🌱 Seeding Graph Nodes & Relationships...")
    
    # 1. Create Patient
    g.query("""
        CREATE (p:Patient {
            id: 'patient_001',
            name: 'Ramesh Kumar',
            age: 54,
            gender: 'Male',
            phone: '+919876543210',
            blood_group: 'O+'
        })
    """)

    # 2. Create Symptoms
    g.query("""
        CREATE (s1:Symptom {id: 'sym_fever', name: 'High Fever', severity_score: 8}),
               (s2:Symptom {id: 'sym_cough', name: 'Severe Cough', severity_score: 6}),
               (s3:Symptom {id: 'sym_breath', name: 'Shortness of Breath', severity_score: 9})
    """)

    # 3. Create Condition & Specialties
    g.query("""
        CREATE (c1:Condition {id: 'cond_pneumonia', name: 'Acute Pneumonia', triage_level: 'Critical'}),
               (c2:Condition {id: 'cond_dengue', name: 'Dengue Fever', triage_level: 'High'})
    """)

    # 4. Create Hospitals & Beds
    g.query("""
        CREATE (h1:Hospital {id: 'hosp_phc_shivpur', name: 'Shivpur PHC Center', phone: '+91542220011', type: 'PHC'}),
               (h2:Hospital {id: 'hosp_bhu_trauma', name: 'BHU Trauma Center', phone: '+91542220099', type: 'Tertiary'})
        CREATE (b1:Bed {id: 'bed_icu_01', type: 'ICU', is_available: true}),
               (b2:Bed {id: 'bed_oxy_01', type: 'Oxygen', is_available: true})
        CREATE (h2)-[:HAS_BED]->(b1),
               (h1)-[:HAS_BED]->(b2)
    """)

    # 5. Connect Relationships
    g.query("""
        MATCH (p:Patient {id: 'patient_001'}), (s1:Symptom {id: 'sym_fever'}), (s3:Symptom {id: 'sym_breath'})
        CREATE (p)-[:EXHIBITS {since_days: 2}]->(s1),
               (p)-[:EXHIBITS {since_days: 1}]->(s3)
    """)

    g.query("""
        MATCH (s3:Symptom {id: 'sym_breath'}), (c1:Condition {id: 'cond_pneumonia'})
        CREATE (s3)-[:INDICATES {probability: 0.90}]->(c1)
    """)

    g.query("""
        MATCH (c1:Condition {id: 'cond_pneumonia'})
        SET c1.requires_specialty = 'Pulmonology'
    """)

    g.query("""
        CREATE (doc:Doctor {id: 'doc_verma', name: 'Dr. A. K. Verma', specialty: 'Pulmonology', available: true})
        WITH doc
        MATCH (h2:Hospital {id: 'hosp_bhu_trauma'})
        CREATE (h2)-[:EMPLOYS]->(doc)
    """)

    print("✅ Graph successfully seeded!")

    # 6. Execute Multi-hop Cypher Traversal for Autonomous Action
    print("\n🔍 Executing Multi-Hop Cypher Triage Traversal Query:")
    query = """
        MATCH (p:Patient {id: 'patient_001'})-[e:EXHIBITS]->(s:Symptom)-[i:INDICATES]->(c:Condition)
        MATCH (h:Hospital)-[:EMPLOYS]->(doc:Doctor {specialty: c.requires_specialty, available: true}),
              (h)-[:HAS_BED]->(b:Bed {type: 'ICU', is_available: true})
        RETURN p.name AS patient_name,
               p.phone AS patient_phone,
               c.name AS suspected_condition,
               c.triage_level AS triage_level,
               h.name AS hospital_name,
               h.phone AS hospital_contact,
               doc.name AS assigned_doctor,
               count(b) AS icu_beds_available
    """

    res = g.query(query)
    for row in res.result_set:
        print(f"\n🚨 TRIAGE ACTION DECISION:")
        print(f"  • Patient: {row[0]} ({row[1]})")
        print(f"  • Suspected Condition: {row[2]} [Triage Risk: {row[3]}]")
        print(f"  • Target Facility: {row[4]} (Phone: {row[5]})")
        print(f"  • Assigned Specialist: {row[6]}")
        print(f"  • ICU Bed Available: Yes ({row[7]} bed found)")

if __name__ == "__main__":
    print("=== CareGraph AI — FalkorDB Prototype Seeder ===")
    seed_caregraph_database()
